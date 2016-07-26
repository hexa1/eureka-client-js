import winston from 'winston';

export default function configureLogger(level) {
  winston.loggers.add('eureka-client', {
    console: {
      level,
      colorize: true,
      label: 'eureka-client',
    },
  });
}
