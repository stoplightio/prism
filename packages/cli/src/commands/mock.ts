import { Command } from '@oclif/command';
import { ARGS, FLAGS } from '../const/options';
import { createMultiProcessPrism, createSingleProcessPrism } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = FLAGS;
  public static args = [ARGS.spec];

  public run() {
    const {
      flags: { port, dynamic, host, multiprocess },
      args: { spec },
    } = this.parse(Server);

    if (multiprocess) {
      return createMultiProcessPrism({ dynamic, port, host, spec });
    }

    return createSingleProcessPrism({ dynamic, port, host, spec });
  }
}
