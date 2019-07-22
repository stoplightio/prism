import * as yargs from 'yargs';

import mockCommand from './commands/mock';

const _v = yargs
  .scriptName('prism')
  .command(mockCommand)
  .demandCommand()
  .version(false)
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth()).argv;
