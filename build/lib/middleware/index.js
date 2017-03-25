'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createEurekaMiddleware;

var _env = require('./env');

var _env2 = _interopRequireDefault(_env);

var _health = require('./health');

var _health2 = _interopRequireDefault(_health);

var _metrics = require('./metrics');

var _metrics2 = _interopRequireDefault(_metrics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createEurekaMiddleware(instance) {
  const { port, securePort, version } = instance;
  const activePort = instance.port['@enabled'] === 'true' ? port.$ : securePort.$;

  return function eurekaMiddleware(req, res, next) {
    switch (req.path) {
      case '/info':
        return res.json({ status: 'UP', version });
      case '/metrics':
        return res.json((0, _metrics2.default)());
      case '/env':
        return res.json((0, _env2.default)(activePort));
      case '/health':
        return (0, _health2.default)().then(info => res.json(info)).catch(err => {
          res.status(500).send('could not get health');
        });
      default:
        next();
    }
  };
}
module.exports = exports['default'];