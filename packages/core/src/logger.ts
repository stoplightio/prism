import * as pino from 'pino';
import { levels } from 'pino';

levels.labels[10] = 'note';
levels.values.note = 10;
levels.labels[11] = 'success';
levels.values.success = 11;
levels.labels[12] = 'start';
levels.values.start = 12;

function createLogger(name: string) {
  const options: pino.LoggerOptions = {
    name,
    customLevels: {
      note: 10,
      success: 11,
      start: 12,
    },
    level: 'note',
    base: {},
    timestamp: false,
  };

  return pino(options);
}

export { levels as logLevels, createLogger };
