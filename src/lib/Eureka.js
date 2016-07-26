import rp from 'request-promise';
import winston from 'winston';

import configureLogger from './log';
import { formatError, checkInstanceUp } from './utils';

const defaultOptions = {
  registerRetryInterval: 5,
  heartbeatInterval: 5,
  registryInterval: 15,
  retryRegisterAfter: 3,
  dataCenterInfo: {
    name: 'MyOwn',
  },
};

export default class EurekaClient {
  constructor(options) {
    if (!options) {
      throw new Error('Missing eureka options');
    }

    this.options = Object.assign({}, defaultOptions, options);

    configureLogger(options.logLevel);
    this.logger = winston.loggers.get('eureka-client');

    this.appCache = {};
    this.heartbeatTimer = null;
    this.registryTimer = null;
    this.failedHeartbeatAttempts = 0;

    this.register = this.register.bind(this);
    this.startHeartbeats = this.startHeartbeats.bind(this);
    this.startRegistryFetcher = this.startRegistryFetcher.bind(this);
  }

  register() {
    const { eurekaHost, appName, hostName, ipAddr, port, instanceId, statusPageUrl,
      dataCenterInfo, registerRetryInterval, heartbeatInterval, registryInterval  } = this.options;

    this.logger.log('info', 'registering with eureka');

    return rp({
      uri: `${eurekaHost}/apps/${appName}`,
      method: 'POST',
      body: {
        instance: {
          hostName,
          ipAddr,
          port,
          dataCenterInfo,
          statusPageUrl,
          app: appName,
          vipAddress: appName,
          metadata: {
            instanceId,
          },
        },
      },
      json: true,
      resolveWithFullResponse: true,
    }).then(res => {
      if (res.statusCode !== 204) {
        throw new Error(res);
      }

      this.logger.log('info', 'registered with %s', eurekaHost);
      this.logger.log('info', 'hostname is %s', hostName);
      this.logger.log('info', 'instance ID is %s', instanceId);

      this.logger.log('info', 'starting heartbeats at interval of %d seconds', heartbeatInterval);
      this.startHeartbeats();

      this.logger.log('info', 'starting registry fetcher at interval of %d seconds', registryInterval);
      this.startRegistryFetcher();

      this.failedHeartbeatAttempts = 0;
    }).catch(err => {
      this.logger.log('error', `registration failure: ${formatError(err)}`);
      this.logger.log('info', 'retrying registration in %d seconds', registerRetryInterval);

      setTimeout(this.register, registerRetryInterval * 1000);
      return err;
    });
  }

  deregister() {
    const { eurekaHost, appName, instanceId } = this.options;

    return rp({
      uri: `${eurekaHost}/apps/${appName}/${encodeURIComponent(instanceId)}`,
      method: 'DELETE',
    });
  }

  fetchRegistry() {
    const { eurekaHost } = this.options;

    return rp({
      uri: `${eurekaHost}/apps`,
      method: 'GET',
      json: true,
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
      this.logger.log('error', `registry fetch error: ${formatError(err)}`);
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
    return new Promise((resolve, reject) => {
      const instances = this.appCache[appId];
      const err = new Error();
      let instanceToTest;

      err.error = {
        statusCode: 503,
        message: 'Service unavailable',
      };

      if (!instances) {
        err.error.reason = 'app is not in cache';
        this.logger.log('error', '%s is unreachable', appId);
        return reject(err);
      }

      if (Array.isArray(instances)) {
        if (instances[instanceNumber] === undefined) {
          err.error.reason = 'app has no available instances';
          this.logger.log('error', '%s is unreachable', appId);
          return reject(err);
        } else {
          instanceToTest = instances[instanceNumber];
        }
      } else {
        instanceToTest = instances;
      }

      return checkInstanceUp(instanceToTest).then(instance => {
        const { hostName, securePort, port } = instance;
        const protocol = securePort['@enabled'] === 'true' ? 'https' : 'http';
        const hostPort = securePort['@enabled'] === 'true' ? securePort.$ : port['@enabled'] === 'true' ? port.$ : 80;

        return resolve(`${protocol}://${hostName}:${hostPort}`);
      }).catch(() => {
        if (Array.isArray(instances)) {
          return getInstanceByAppId(appId, instanceNumber + 1);
        } else {
          err.error.reason = 'app is down';
          this.logger.log('error', '%s is unreachable', appId);
          return reject(err);
        }
      });
    });
  }

  sendHeartbeat() {
    const { eurekaHost, appName, hostName, instanceId } = this.options;

    return rp({
      uri: `${eurekaHost}/apps/${appName}/${hostName}:${instanceId}`,
      method: 'PUT',
    }).then(() => {
      this.logger.log('debug', 'sent heartbeat');
    }).catch(err => {
      this.logger.log('error', `heartbeat error, attempt #${this.failedHeartbeatAttempts}: ${formatError(err)}`);
      return err;
    });
  }

  startHeartbeats() {
    const { retryRegisterAfter, heartbeatInterval } = this.options;

    this.stopHeartbeats();

    return this.sendHeartbeat().then(err => {
      if (err) {
        this.failedHeartbeatAttempts++;

        // re-register after x failed attempts
        if (this.failedHeartbeatAttempts > retryRegisterAfter) {
          this.register().then(err => {
            // if there's a registration error, this.register() will retry itself,
            // and then start heartbeats again
            if (!err) {
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
