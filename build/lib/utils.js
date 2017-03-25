'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatError = formatError;
exports.checkInstanceUp = checkInstanceUp;
exports.getActivePortAndProtocol = getActivePortAndProtocol;
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

function getActivePortAndProtocol(instance) {
  if (instance.securePort && instance.securePort['@enabled'] === 'true') {
    return { port: instance.securePort.$, protocol: 'https' };
  } else {
    return { port: instance.port.$, protocol: 'http' };
  }
}

function createInstanceObject(instanceOptions = {}) {
  const { port, securePort, app, instanceId } = instanceOptions;
  const instance = Object.assign({}, instanceOptions, {
    metadata: Object.assign({}, instanceOptions.metadata, {
      instanceId
    })
  });

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

  const { port: activePort, protocol } = getActivePortAndProtocol(instance);

  if (!instance.homePageUrl) {
    instance.homePageUrl = `${ protocol }://${ instance.hostName }:${ activePort }`;
  }

  if (!instance.statusPageUrl) {
    instance.statusPageUrl = `${ protocol }://${ instance.hostName }:${ activePort }/info`;
  }

  if (!instance.healthCheckUrl) {
    instance.healthCheckUrl = `${ protocol }://${ instance.hostName }:${ activePort }/health`;
  }

  return instance;
}