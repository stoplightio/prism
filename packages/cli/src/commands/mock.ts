import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { CommandModule } from 'yargs';
import { CreateMockServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';
import { runPrismAndSetupWatcher } from '../util/runner';

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
    const {
      multiprocess,
      dynamic,
      port,
      host,
      cors,
      operations,
      spec,
      log,
    } = (parsedArgs as unknown) as CreateMockServerOptions & {
      multiprocess: boolean;
      spec: string;
    };

    const createPrism = multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    const options = { cors, dynamic, port, host, operations, multiprocess, log };

    return runPrismAndSetupWatcher(createPrism, options, spec);
  },
};

export default mockCommand;
