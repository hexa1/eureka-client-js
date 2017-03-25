export default function env(activePort) {
  return {
    profiles: [process.env.NODE_ENV],
    'server.ports': {
      'local.server.port': activePort,
    },
    commandLineArgs: process.argv,
    systemProperties: process.config,
    systemEnvironment: process.env,
  };
}
