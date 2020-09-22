import { CommandModule } from 'yargs';
import { CreateMockServerOptions, createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';
import { runPrismAndSetupWatcher } from '../util/runner';
import * as D from 'io-ts/Decoder';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';

const createMockServerOptionsDecoder = D.type<CreateMockServerOptions>({
  cors: D.boolean,
  document: D.string,
  dynamic: D.boolean,
  errors: D.boolean,
  host: D.string,
  multiprocess: D.boolean,
  port: D.number,
});

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
    pipe(
      createMockServerOptionsDecoder.decode(parsedArgs),
      E.fold(
        () => console.error('Invalid Arguments'),
        options => {
          const createPrism = options.multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
          return runPrismAndSetupWatcher(createPrism, options);
        }
      )
    );
  },
};

export default mockCommand;
