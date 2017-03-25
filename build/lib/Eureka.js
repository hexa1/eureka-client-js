'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _utils = require('./utils');

var _middleware = require('./middleware');

var _middleware2 = _interopRequireDefault(_middleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultOptions = {
  registerRetryInterval: 5,
  heartbeatInterval: 5,
  registryInterval: 15,
  retryRegisterAfter: 3,
  instance: {}
};

class AppUnavailableError extends Error {
  constructor(reason) {
    super();

    this.error = {
      statusCode: 503,
      message: 'Service unavailable',
      reason
    };
  }
}

class EurekaClient {
  constructor(options) {
    if (!options) {
      throw new Error('Missing eureka options');
    }

    // make it easier to mock in tests
    this.request = _requestPromise2.default;
    this.checkInstanceUp = _utils.checkInstanceUp;

    this.options = Object.assign({}, defaultOptions, options);
    this.instance = (0, _utils.createInstanceObject)(this.options.instance);

    this.logger = (0, _log2.default)(options.logLevel);

    this.appCache = {};
    this.heartbeatTimer = null;
    this.registryTimer = null;
    this.failedHeartbeatAttempts = 0;

    this.register = this.register.bind(this);
    this.startHeartbeats = this.startHeartbeats.bind(this);
    this.startRegistryFetcher = this.startRegistryFetcher.bind(this);
    this.middleware = this.middleware.bind(this);
  }

  middleware() {
    return (0, _middleware2.default)(this.instance);
  }

  register() {
    const {
      eurekaHost,
      registerRetryInterval,
      heartbeatInterval,
      registryInterval,
      instance: { app, hostName, instanceId }
    } = this.options;

    this.logger.log('info', 'registering with eureka');

    return this.request({
      uri: `${ eurekaHost }/apps/${ app }`,
      method: 'POST',
      body: { instance: this.instance },
      json: true,
      resolveWithFullResponse: true
    }).then(res => {
      if (res.statusCode !== 204) {
        throw new Error(res);
      }

      this.logger.log('info', 'registered with %s', eurekaHost);
      this.logger.log('info', 'hostname is %s', hostName);
      this.logger.log('info', 'instance ID is %s', instanceId);

      this.logger.log('info', 'starting registry fetcher at interval of %d seconds', registryInterval);
      this.startRegistryFetcher();

      this.failedHeartbeatAttempts = 0;

      this.logger.log('info', 'starting heartbeats at interval of %d seconds', heartbeatInterval);
      return this.startHeartbeats();
    }).catch(err => {
      this.logger.log('error', `registration failure: ${ (0, _utils.formatError)(err) }`);
      this.logger.log('info', 'retrying registration in %d seconds', registerRetryInterval);

      this.registerRetryTimeout = setTimeout(this.register, registerRetryInterval * 1000);
      return err;
    });
  }

  stopRegisterRetry() {
    clearTimeout(this.registerRetryTimeout);
  }

  deregister() {
    const { eurekaHost, instance: { app, instanceId } } = this.options;

    return this.request({
      uri: `${ eurekaHost }/apps/${ app }/${ encodeURIComponent(instanceId) }`,
      method: 'DELETE'
    });
  }

  fetchRegistry() {
    const { eurekaHost } = this.options;

    return this.request({
      uri: `${ eurekaHost }/apps`,
      method: 'GET',
      json: true
    }).then(({ applications: { application } }) => {
      this.logger.log('debug', 'fetched registry');

      if (Array.isArray(application)) {
        application.reduce((cache, { name, instance }) => {
          cache[name] = instance;
          return cache;
        }, this.appCache);
      } else {
        this.appCache[application.name] = application.instance;
      }
    }).catch(err => {
      this.logger.log('error', `registry fetch error: ${ (0, _utils.formatError)(err) }`);
      return err;
    });
  }

  startRegistryFetcher() {
    const { registryInterval } = this.options;

    this.stopRegistryFetcher();

    return this.fetchRegistry().catch(() => {}).then(() => {
      this.registryTimer = setTimeout(this.startRegistryFetcher, registryInterval * 1000);
    });
  }

  stopRegistryFetcher() {
    clearTimeout(this.registryTimer);
  }

  getInstanceByAppId(appId, instanceNumber = 0) {
    const instances = this.appCache[appId];
    let instanceToTest;

    if (!instances) {
      this.logger.log('error', '%s is unreachable', appId);
      return Promise.reject(new AppUnavailableError('app is not in cache'));
    }

    if (Array.isArray(instances)) {
      if (!instances[instanceNumber]) {
        this.logger.log('error', '%s is unreachable', appId);
        return Promise.reject(new AppUnavailableError('app has no available instances'));
      } else {
        instanceToTest = instances[instanceNumber];
      }
    } else {
      instanceToTest = instances;
    }

    return this.checkInstanceUp(instanceToTest).then(instance => {
      const { hostName, securePort = {}, port = {} } = instance;
      const hasSecurePort = securePort['@enabled'] && securePort['@enabled'].toString() === 'true';
      const hasInsecurePort = port['@enabled'] && port['@enabled'].toString() === 'true';
      const protocol = hasSecurePort ? 'https' : 'http';

      let hostPort;
      if (hasSecurePort) {
        hostPort = securePort.$;
      } else if (hasInsecurePort) {
        hostPort = port.$;
      } else {
        hostPort = 80;
      }

      return `${ protocol }://${ hostName }:${ hostPort }`;
    }).catch(err => {
      if (Array.isArray(instances)) {
        return this.getInstanceByAppId(appId, instanceNumber + 1);
      } else {
        this.logger.log('error', '%s is unreachable', appId);
        throw new AppUnavailableError('app is down');
      }
    });
  }

  sendHeartbeat() {
    const { eurekaHost, instance: { app, instanceId } } = this.options;

    return this.request({
      uri: `${ eurekaHost }/apps/${ app }/${ instanceId }`,
      method: 'PUT'
    }).then(() => {
      this.logger.log('debug', 'sent heartbeat');
    }).catch(err => {
      this.logger.log('error', `heartbeat error, attempt #${ this.failedHeartbeatAttempts }: ${ (0, _utils.formatError)(err) }`);
      return err;
    });
  }

  startHeartbeats() {
    const { retryRegisterAfter, heartbeatInterval } = this.options;

    this.stopHeartbeats();

    return this.sendHeartbeat().then(heartbeatErr => {
      if (heartbeatErr) {
        this.failedHeartbeatAttempts++;

        // re-register after x failed attempts
        if (this.failedHeartbeatAttempts > retryRegisterAfter) {
          this.register().then(regErr => {
            // if there's a registration error, this.register() will retry itself,
            // and then start heartbeats again
            if (!regErr) {
              this.failedHeartbeatAttempts = 0;
            }
          });
        } else {
          this.heartbeatTimer = setTimeout(this.startHeartbeats, heartbeatInterval * 1000);
        }
      } else {
        this.heartbeatTimer = setTimeout(this.startHeartbeats, heartbeatInterval * 1000);
      }
    });
  }

  stopHeartbeats() {
    clearTimeout(this.heartbeatTimer);
  }
}
exports.default = EurekaClient;
module.exports = exports['default'];