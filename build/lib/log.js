'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = configureLogger;

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _config = require('winston/lib/winston/config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function configureLogger(level) {
  _winston2.default.loggers.add('eureka-client', {
    console: {
      level,
      colorize: true,
      label: 'eureka-client',
      formatter(options) {
        return `${ _config2.default.colorize(options.level, `[${ options.label }]`) } ${ options.message }`;
      }
    }
  });
}
module.exports = exports['default'];