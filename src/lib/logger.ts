import * as winston from 'winston';

function createTransports(loggerName?: string): winston.TransportInstance[] {
  const transports = [
    new winston.transports.Console({
      label: loggerName,
     }),
  ];
  // TODO: Sentry
  return transports;
}

export default function createLogger(name: string): winston.LoggerInstance {
  if (winston.loggers.has(name)) {
    return winston.loggers.get(name);
  }
  return winston.loggers.add(name, {
    transports: createTransports(name),
  });
}

export { LoggerInstance as Logger } from 'winston';
