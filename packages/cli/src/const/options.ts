import { flags as oflags } from '@oclif/command';
import chalk from 'chalk';

export const ARGS = {
  spec: {
    name: 'spec',
    description: 'Path to a spec file. Can be both a file or a fetchable resource on the web',
    required: true,
  },
};

export const FLAGS = {
  port: oflags.integer({
    char: 'p',
    description: 'Port that Prism will run on.',
    default: 4010,
    required: true,
  }),

  host: oflags.string({
    char: 'h',
    description: 'Host that Prism will listen to.',
    default: '127.0.0.1',
  }),

  dynamic: oflags.boolean({
    char: 'd',
    description: 'Dynamically generate examples.',
    default: false,
  }),

  multiprocess: oflags.boolean({
    char: 'm',
    description: 'Fork the http server from the CLI',
    default: process.env.NODE_ENV === 'production',
  }),
};

export const LOG_COLOR_MAP = {
  CLI: chalk.bgWhiteBright,
  'HTTP SERVER': chalk.bgYellowBright,
  MOCKER: chalk.bgBlueBright,
  HTTP: chalk.bgGreenBright,
};
