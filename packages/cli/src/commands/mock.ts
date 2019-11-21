import { CommandModule } from 'yargs';
import { CreateMockServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';
import { runPrismAndSetupWatcher } from '../util/runner';
import { pick } from 'lodash';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given document file',
  command: 'mock <document>',
  builder: yargs =>
    yargs
      .positional('document', {
        description: 'Path to a document file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
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
    const options = pick(
      (parsedArgs as unknown) as CreateMockServerOptions,
      'cors',
      'dynamic',
      'port',
      'host',
      'document',
      'multiprocess',
      'errors',
      'verbose'
    );

    const createPrism = options.multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    return runPrismAndSetupWatcher(createPrism, options);
  },
};

export default mockCommand;
