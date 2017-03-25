'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = health;

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _diskusage = require('diskusage');

var _diskusage2 = _interopRequireDefault(_diskusage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const path = _os2.default.platform() === 'win32' ? 'c:' : '/';

function health() {
  return new Promise((resolve, reject) => {
    _diskusage2.default.check(path, (err, info) => {
      if (err) {
        return reject(err);
      }

      resolve({
        description: 'Eureka JS Client',
        status: 'UP',
        diskSpace: {
          status: 'UP',
          total: info.total,
          free: info.free,
          threshold: info.total / 10
        }
      });
    });
  });
}
module.exports = exports['default'];