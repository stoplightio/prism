import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { pick } from 'lodash';
import { CommandModule } from 'yargs';
import { CreateMockServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given document file',
  command: 'mock <document>',
  builder: yargs =>
    yargs
      .positional('document', {
        description: 'Path to a document file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
      .middleware(async argv => (argv.operations = await getHttpOperationsFromResource(argv.document!)))
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
    const p: CreateMockServerOptions = pick(
      (parsedArgs as unknown) as CreateMockServerOptions,
      'dynamic',
      'cors',
      'host',
      'port',
      'operations',
      'multiprocess',
      'log',
    );

    return p.multiprocess ? createMultiProcessPrism(p) : createSingleProcessPrism(p);
  },
};

export default mockCommand;
