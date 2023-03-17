import * as pino from 'pino';
import { defaultsDeep } from 'lodash';

export function createLogger(
  name: string,
  overrideOptions: pino.LoggerOptions = {},
  destination?: pino.DestinationStream
): pino.Logger {
  const options: pino.LoggerOptions = defaultsDeep(overrideOptions, {
    name,
    base: {},
    customLevels: {
      success: pino.levels.values['info'] + 2,
    },
    level: 'success',
    timestamp: false,
  });

  if (destination) return pino(options, destination);
  return pino(options);
}
