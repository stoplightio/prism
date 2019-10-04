import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { pick } from 'lodash';
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
      .options(sharedOptions),
  handler: parsedArgs => {
    const p: CreateProxyServerOptions = pick(
      (parsedArgs as unknown) as CreateProxyServerOptions,
      'dynamic',
      'cors',
      'host',
      'port',
      'operations',
      'multiprocess',
      'upstream',
      'log',
    );

    return p.multiprocess ? createMultiProcessPrism(p) : createSingleProcessPrism(p);
  },
};

export default proxyCommand;
