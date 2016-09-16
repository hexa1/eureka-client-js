'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatError = formatError;
exports.checkInstanceUp = checkInstanceUp;

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