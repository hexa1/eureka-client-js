'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = metrics;

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function metrics() {
  const { heapTotal, heapUsed } = process.memoryUsage();
  const uptime = Math.round(process.uptime());
  const processors = _os2.default.cpus().length;
  const [loadAvg] = _os2.default.loadavg();

  return {
    mem: _os2.default.totalmem() / 1024,
    'mem.free': _os2.default.freemem() / 1024,
    processors,
    uptime,
    'instance.uptime': uptime,
    'systemload.average': loadAvg,
    heap: heapTotal,
    'heap.used': heapUsed
  };
}
module.exports = exports['default'];