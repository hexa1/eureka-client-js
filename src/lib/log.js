import winston from 'winston';
import winstonConfig from 'winston/lib/winston/config';

export default function configureLogger(level) {
  winston.loggers.add('eureka-client', {
    console: {
      level,
      colorize: true,
      label: 'eureka-client',
      formatter(options) {
        return `${winstonConfig.colorize(options.level, `[${options.label}]`)} ${options.message}`;
      },
    },
  });

  return winston.loggers.get('eureka-client');
}
