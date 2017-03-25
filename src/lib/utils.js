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

export function getActivePortAndProtocol(instance) {
  if (instance.securePort && instance.securePort['@enabled'] === 'true') {
    return { port: instance.securePort.$, protocol: 'https' };
  } else {
    return { port: instance.port.$, protocol: 'http' };
  }
}

export function createInstanceObject(instanceOptions = {}) {
  const { port, securePort, app, instanceId } = instanceOptions;
  const instance = Object.assign({}, instanceOptions, {
    metadata: Object.assign({}, instanceOptions.metadata, {
      instanceId,
    }),
  });

  if (port === null || port === undefined) {
    instance.port = {
      $: null,
      '@enabled': false,
    };
  } else if (!isNaN(parseInt(port, 10))) {
    instance.port = {
      $: parseInt(port, 10),
      '@enabled': true,
    };
  } else {
    instance.port = port;
  }

  if (securePort === null || securePort === undefined) {
    instance.securePort = {
      $: null,
      '@enabled': false,
    };
  } else if (!isNaN(parseInt(securePort, 10))) {
    instance.securePort = {
      $: parseInt(securePort, 10),
      '@enabled': true,
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
    instance.homePageUrl = `${protocol}://${instance.hostName}:${activePort}`;
  }

  if (!instance.statusPageUrl) {
    instance.statusPageUrl = `${protocol}://${instance.hostName}:${activePort}/info`;
  }

  if (!instance.healthCheckUrl) {
    instance.healthCheckUrl = `${protocol}://${instance.hostName}:${activePort}/health`;
  }

  return instance;
}
