import * as pino from 'pino';
import { levels } from 'pino';

levels.labels[10] = 'note';
levels.values.note = 10;
levels.labels[20] = 'success';
levels.values.success = 20;

function createLogger(name: string) {
  const options: pino.LoggerOptions = {
    name,
    customLevels: {
      note: 10,
      success: 20,
    },
    level: 'note',
    base: null,
    timestamp: false,
  };

  return pino(options);
}

export { levels as logLevels, createLogger };
