import chalk from 'chalk';

export const LOG_COLOR_MAP = {
  CLI: { index: 0, color: chalk.bgWhiteBright },
  'HTTP SERVER': { index: 0, color: chalk.bgYellowBright },
  NEGOTIATOR: { index: 1, color: chalk.bgCyanBright },
  VALIDATOR: { index: 1, color: chalk.bgGreenBright },
};
