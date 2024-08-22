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
      .coerce('upstream', (value: string) => {
        try {
          return new URL(value);
        } catch (e) {
          throw new Error(`Invalid upstream URL provided: ${value}`);
        }
      })
      .options({
        ...sharedOptions,
        'validate-request': {
          description: 'Validate incoming HTTP requests.',
          boolean: true,
          default: true,
        },
        'upstream-proxy': {
          description:
            'If an http proxy is required to reach upstream, formatted as "{protocol}://[{user}[:{password}]@]{host}[:{port}]". eg "http://myUser:myPassword@proxy.example.com:1234"',
          string: true,
        },
      }),
  handler: async parsedArgs => {
    parsedArgs.validateRequest = parsedArgs['validate-request'];
    const p: CreateProxyServerOptions = pick(
      parsedArgs as unknown as CreateProxyServerOptions,
      'dynamic',
      'cors',
      'host',
      'port',
      'document',
      'multiprocess',
      'upstream',
      'errors',
      'validateRequest',
      'verboseLevel',
      'ignoreExamples',
      'seed',
      'upstreamProxy',
      'jsonSchemaFakerFillProperties'
    );

    const createPrism = p.multiprocess ? createMultiProcessPrism : createSingleProcessPrism;
    await runPrismAndSetupWatcher(createPrism, p);
  },
};

export default proxyCommand;
