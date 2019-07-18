import { CommandModule } from 'yargs';
import { createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given spec file',
  command: 'mock <spec>',
  builder: yargs =>
    yargs
      .positional('spec', {
        description: 'Path to a spec file. Can be both a file or a fetchable resource on the web',
        type: 'string',
      })
      .options({
        port: {
          alias: 'p',
          description: 'Port that Prism will run on.',
          default: 4010,
          demandOption: true,
          number: true,
        },

        host: {
          alias: 'h',
          description: 'Host that Prism will listen to.',
          default: '127.0.0.1',
          demandOption: true,
          string: true,
        },

        dynamic: {
          alias: 'd',
          description: 'Dynamically generate examples.',
          boolean: true,
          default: false,
        },

        multiprocess: {
          char: 'm',
          description: 'Forks the http server from the CLI for faster log processing',
          boolean: true,
          default: process.env.NODE_ENV === 'production',
        },
      }),
  handler: stuff => {
    const { multiprocess, dynamic, port, host, spec } = stuff;

    if (multiprocess) {
      // @ts-ignore
      return createMultiProcessPrism({ dynamic, port, host, spec });
    }
    // @ts-ignore
    return createSingleProcessPrism({ dynamic, port, host, spec });
  },
};

module.exports = mockCommand;
