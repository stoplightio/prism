import { partial } from 'lodash';
import { CommandModule } from 'yargs';
import { documentPositional, handler, middleware, onFail } from './shared/helpers';
import options from './shared/options';

const proxyCommand: CommandModule = {
  describe: 'Start a proxy server with the given document',
  command: 'proxy <upstream> <document>',
  builder: yargs =>
    yargs
      .positional('upstream', {
        description: 'An address for the destination server.',
        type: 'string',
      })
      .positional(...documentPositional)
      .middleware(middleware)
      .fail(partial(onFail, yargs))
      .options({
        ...options,
        mode: {
          choices: ['log', 'error'],
          description: 'The way mismatches are reported. Choose error for Prism error format.',
          demandOption: false,
          default: 'log',
          string: true,
        },
      }),
  handler: args => handler({ upstream: args.upstream, log: args.log }, args),
};

export default proxyCommand;
