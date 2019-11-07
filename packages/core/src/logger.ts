import * as pino from 'pino';
import { defaultsDeep } from 'lodash';

function createLogger(
  name: string,
  overrideOptions: pino.LoggerOptions = {},
  destination?: pino.DestinationStream
): pino.Logger {
  const options: pino.LoggerOptions = defaultsDeep(overrideOptions, {
    name,
    customLevels: {
      success: 11,
    },
    base: null,
    timestamp: false,
  });

  if (destination) return pino(options, destination);
  return pino(options);
}

export { createLogger };
