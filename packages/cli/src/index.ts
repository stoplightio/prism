import * as yargs from 'yargs';

import mockCommand from './commands/mock';

const _v = yargs
  .scriptName('prism')
  .version()
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth())
  .command(mockCommand)
  .demandCommand(1, '').argv;
