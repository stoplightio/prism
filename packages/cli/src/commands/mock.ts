import { partial } from 'lodash';
import { CommandModule } from 'yargs';
import { documentPositional, handler, middleware, onFail } from './shared/helpers';
import options from './shared/options';

const mockCommand: CommandModule = {
  describe: 'Start a mock server with the given document',
  command: 'mock <document>',
  builder: yargs =>
    yargs
      .positional(...documentPositional)
      .middleware(middleware)
      .fail(partial(onFail, yargs))
      .options({
        ...options,
        dynamic: {
          alias: 'd',
          description: 'Dynamically generate examples.',
          boolean: true,
          default: false,
        },
      }),
  handler: args => handler({ dynamic: args.dynamic }, args),
};

export default mockCommand;
