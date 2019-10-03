import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { CommandModule } from 'yargs';
import { CreateBaseServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given spec file',
  command: 'mock <spec>',
  builder: yargs =>
    yargs
      .positional('spec', {
        description: 'Path to a spec file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
      .middleware(async argv => (argv.operations = await getHttpOperationsFromResource(argv.spec!)))
      .options({
        ...sharedOptions,
        dynamic: {
          alias: 'd',
          description: 'Dynamically generate examples.',
          boolean: true,
          default: false,
        },
      }),
  handler: parsedArgs => {
    const p = (parsedArgs as unknown) as CreateBaseServerOptions & { multiprocess: boolean };
    return p.multiprocess ? createMultiProcessPrism(p) : createSingleProcessPrism(p);
  },
};

export default mockCommand;
