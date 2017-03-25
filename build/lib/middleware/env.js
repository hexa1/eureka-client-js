'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = env;
function env(activePort) {
  return {
    profiles: [process.env.NODE_ENV],
    'server.ports': {
      'local.server.port': activePort
    },
    commandLineArgs: process.argv,
    systemProperties: process.config,
    systemEnvironment: process.env
  };
}
module.exports = exports['default'];