import winston from 'winston';

const logger = winston.loggers.get('eureka-client');

// disable app logging during tests
if (logger.transports.console) {
  logger.remove(winston.transports.Console);
}
