import { Command } from '@oclif/command';
import { ARGS, FLAGS } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = { port: FLAGS.port };
  public static args = [ARGS.spec];

  public async run() {
    const {
      flags: { port },
      args: { spec },
    } = this.parse(Server);

    const server = createServer(spec, { mock: true });

    const address = await server.listen(port);

    this.log(address);
  }
}
