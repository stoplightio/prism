import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import * as signale from 'signale';
import { createMultiProcessPrism, CreatePrismOptions, createSingleProcessPrism } from '../../util/createServer';

export const middleware = async (argv: any) => (argv.operations = await getHttpOperationsFromResource(argv.document!));

export const onFail = (yargs: any, msg: string, err: { message: string }) => {
  if (msg) {
    yargs.showHelp();
  } else {
    signale.fatal(err.message);
  }

  process.exit(1);
};

export const documentPositional: [string, object] = [
  'document',
  {
    description: 'Path to a document. Can be both a file or a fetchable resource on the web.',
    type: 'string',
  },
];

export const handler = (opts: any, parsedArgs: any) => {
  const { multiprocess, port, host, cors, operations } = (parsedArgs as unknown) as CreatePrismOptions & {
    multiprocess: boolean;
  };

  return (multiprocess ? createMultiProcessPrism : createSingleProcessPrism)({ cors, port, host, operations, ...opts });
};
