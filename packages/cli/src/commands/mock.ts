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
        ignoreExamples: {
          description: `Tell Prism to treat the spec as though it has no examples. When in static mode,
                        returns an example that has not been generated using json-schema-faker, but was 
                        created by Prism. When in dynamic mode, this flag is ignored, since in dynamic mode,
                        examples are not consulted and json-schema-faker is used to generate a response based 
                        on the schema defined in the spec`,
          boolean: true,
          default: false,
        },
        seed: {
          description: `Provide a seed so that Prism generates dynamic examples deterministically`,
          string: true,
          demandOption: true,
          default: null
        },
      }),
  handler: async parsedArgs => {
    parsedArgs.jsonSchemaFakerFillProperties = parsedArgs['json-schema-faker-fillProperties'];
    const { multiprocess, dynamic, port, host, cors, document, errors, verboseLevel, ignoreExamples, seed, jsonSchemaFakerFillProperties } =
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
      ignoreExamples,
      seed,
      jsonSchemaFakerFillProperties,
    };

    await runPrismAndSetupWatcher(createPrism, options);
  },
};

export default mockCommand;
