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
      .options({
        ...sharedOptions,
        dynamic: {
          alias: 'd',
          description: 'Dynamically generate examples.',
          boolean: true,
          default: false,
        },
        'json-schema-faker-fillProperties': {
          description: 'Generate additional properties when using dynamic generation.',
          default: undefined,
          boolean: true,
        },
      }),
  handler: async parsedArgs => {
    parsedArgs.jsonSchemaFakerFillProperties = parsedArgs['json-schema-faker-fillProperties'];
    const { multiprocess, dynamic, port, host, cors, document, errors, verboseLevel, jsonSchemaFakerFillProperties } =
      parsedArgs as unknown as CreateMockServerOptions;

    const createPrism = multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    const options = {
      cors,
      dynamic,
      port,
      host,
      document,
      multiprocess,
      errors,
      verboseLevel,
      jsonSchemaFakerFillProperties,
    };

    await runPrismAndSetupWatcher(createPrism, options);
  },
};

export default mockCommand;
