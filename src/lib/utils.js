import { inspect } from 'util';
import rp from 'request-promise';

export function formatError({ statusCode, message, options = {} } = {}) {
  return inspect({
    statusCode,
    message,
    uri: options.uri,
    method: options.method,
  });
}

export function checkInstanceUp(instance) {
  return rp({
    uri: instance.statusPageUrl,
    method: 'GET',
  }).then(() => {
    return instance;
  });
}

export function createInstanceObject(instanceOptions = {}) {
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
  } = instanceOptions;

  const instance = {
    app,
    hostName,
    ipAddr,
    dataCenterInfo,
    statusPageUrl,
    healthCheckUrl,
    homePageUrl,
    metadata: {
      instanceId,
    },
  };

  if (!isNaN(parseInt(port, 10))) {
    instance.port = {
      $: parseInt(port, 10),
      '@enabled': true,
    };
  } else {
    instance.port = port;
  }

  if (!isNaN(parseInt(securePort, 10))) {
    instance.securePort = {
      $: parseInt(securePort, 10),
      '@enabled': true,
    };
  } else {
    instance.securePort = securePort;
  }

  return instance;
}
