import env from './env';
import health from './health';
import metrics from './metrics';

export default function createEurekaMiddleware(instance) {
  const { port, securePort, version } = instance;
  const activePort = instance.port['@enabled'] === 'true' ? port.$ : securePort.$;

  return function eurekaMiddleware(req, res, next) {
    switch (req.path) {
      case '/info': return res.json({ status: 'UP', version });
      case '/metrics': return res.json(metrics());
      case '/env': return res.json(env(activePort));
      case '/health':
        return health().then(info => res.json(info)).catch(err => {
          res.status(500).send('could not get health');
        });
      default: next();
    }
  };
}
