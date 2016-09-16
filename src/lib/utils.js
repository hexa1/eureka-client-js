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
