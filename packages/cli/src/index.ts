#!/usr/bin/env node

import * as yargs from 'yargs';
import mockCommand from './commands/mock';
import proxyCommand from './commands/proxy';

const _v = yargs
  .scriptName('prism')
  .version()
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth())
  .command(mockCommand)
  .command(proxyCommand)
  .demandCommand(1, '').argv;
