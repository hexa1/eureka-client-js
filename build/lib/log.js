'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = configureLogger;

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function configureLogger(level) {
  _winston2.default.loggers.add('eureka-client', {
    console: {
      level,
      colorize: true,
      label: 'eureka-client'
    }
  });
}
module.exports = exports['default'];