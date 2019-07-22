import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';

const commandOptions = fs.existsSync(path.join(__dirname, '../src'))
  ? { path: '../src/commands', extensions: ['ts'] }
  : { path: '../dist/commands', extensions: ['js'] };

const _v = yargs
  .scriptName('prism')
  .commandDir(commandOptions.path, { extensions: commandOptions.extensions })
  .demandCommand()
  .version(false)
  .help(true)
  .strict()
  .wrap(yargs.terminalWidth()).argv;
