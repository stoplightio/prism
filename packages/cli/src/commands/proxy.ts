import { pick } from 'lodash';
import { CommandModule } from 'yargs';
import { createMultiProcessPrism, CreateProxyServerOptions, createSingleProcessPrism } from '../util/createServer';
import sharedOptions from './sharedOptions';
import { runPrismAndSetupWatcher } from '../util/runner';

const proxyCommand: CommandModule = {
  describe: 'Start a proxy server with the given document file',
  command: 'proxy <document> <upstream>',
  builder: yargs =>
    yargs
      .positional('document', {
        description: 'Path to a document file. Can be both a file or a fetchable resource on the web.',
        type: 'string',
      })
      .positional('upstream', {
        description: 'URL to a target server.',
        type: 'string',
      })
      .coerce('upstream', value => {
        try {
          return new URL(value);
        } catch (e) {
          throw new Error(`Invalid upstream URL provided: ${value}`);
        }
      })
      .options(sharedOptions),
  handler: parsedArgs => {
    const p: CreateProxyServerOptions = pick(
      (parsedArgs as unknown) as CreateProxyServerOptions,
      'dynamic',
      'cors',
      'host',
      'port',
      'document',
      'multiprocess',
      'upstream',
      'errors'
    );

    const createPrism = p.multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    return runPrismAndSetupWatcher(createPrism, p);
  },
};

export default proxyCommand;
