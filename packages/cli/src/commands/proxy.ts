import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import * as signale from 'signale';
import { CommandModule } from 'yargs';
import { createMultiProcessPrism, CreateProxyServerOptions, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';

const proxyCommand: CommandModule = {
  describe: 'Start a proxy server with the given spec file',
  command: 'proxy <spec> <upstream>',
  builder: yargs =>
    yargs
      .positional('spec', {
        description: 'Path to a spec file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
      .positional('upstream', {
        description: 'Url to a target server.',
        type: 'string',
      })
      .coerce('upstream', value => {
        try {
          return new URL(value);
        } catch (e) {
          throw new Error(`Invalid upstream URL provided: ${value}`);
        }
      })
      .middleware(async argv => (argv.operations = await getHttpOperationsFromResource(argv.spec!)))
      .fail((_msg, err) => {
        if (err) signale.fatal(err.message);
        else yargs.showHelp();

        process.exit(1);
      })
      .options(sharedOptions),
  handler: parsedArgs => {
    const {
      multiprocess,
      dynamic,
      upstream,
      port,
      host,
      cors,
      operations,
    } = (parsedArgs as unknown) as CreateProxyServerOptions & {
      multiprocess: boolean;
    };

    if (multiprocess) {
      return createMultiProcessPrism({ cors, dynamic, upstream, port, host, operations });
    }

    return createSingleProcessPrism({ cors, dynamic, upstream, port, host, operations });
  },
};

export default proxyCommand;
