#!/usr/bin/env node

import * as yargs from 'yargs';
import mockCommand from './commands/mock';

// tslint:disable-next-line:no-unused-expression
yargs
  .scriptName('prism')
  .version()
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth())
  .command(mockCommand)
  .demandCommand(1, '').argv;
