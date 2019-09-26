#!/usr/bin/env node

import * as yargs from 'yargs';
import mockCommand from './commands/mock';
import proxyCommand from './commands/proxy';

// tslint:disable-next-line:no-unused-expression
yargs
  .scriptName('prism')
  .version()
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth())
  .command(mockCommand)
  .command(proxyCommand)
  .demandCommand(1, '').argv;
