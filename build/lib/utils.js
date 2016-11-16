'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatError = formatError;
exports.checkInstanceUp = checkInstanceUp;
exports.createInstanceObject = createInstanceObject;

var _util = require('util');

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function formatError({ statusCode, message, options = {} } = {}) {
  return (0, _util.inspect)({
    statusCode,
    message,
    uri: options.uri,
    method: options.method
  });
}

function checkInstanceUp(instance) {
  return (0, _requestPromise2.default)({
    uri: instance.statusPageUrl,
    method: 'GET'
  }).then(() => {
    return instance;
  });
}

function createInstanceObject(instanceOptions = {}) {
  const {
    app,
    hostName,
    ipAddr,
    port,
    securePort,
    dataCenterInfo,
    statusPageUrl,
    healthCheckUrl,
    homePageUrl,
    instanceId,
    vipAddress
  } = instanceOptions;

  const instance = {
    app,
    hostName,
    ipAddr,
    dataCenterInfo,
    statusPageUrl,
    healthCheckUrl,
    homePageUrl,
    vipAddress,
    metadata: {
      instanceId
    }
  };

  if (port === null || port === undefined) {
    instance.port = {
      $: null,
      '@enabled': false
    };
  } else if (!isNaN(parseInt(port, 10))) {
    instance.port = {
      $: parseInt(port, 10),
      '@enabled': true
    };
  } else {
    instance.port = port;
  }

  if (securePort === null || securePort === undefined) {
    instance.securePort = {
      $: null,
      '@enabled': false
    };
  } else if (!isNaN(parseInt(securePort, 10))) {
    instance.securePort = {
      $: parseInt(securePort, 10),
      '@enabled': true
    };
  } else {
    instance.securePort = securePort;
  }

  if (instance.port && instance.port['@enabled'] !== undefined) {
    instance.port['@enabled'] = instance.port['@enabled'].toString();
  }

  if (instance.securePort && instance.securePort['@enabled'] !== undefined) {
    instance.securePort['@enabled'] = instance.securePort['@enabled'].toString();
  }

  if (!instance.vipAddress) {
    instance.vipAddress = app;
  }

  return instance;
}