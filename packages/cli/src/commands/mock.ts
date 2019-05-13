import { Command } from '@oclif/command';
import * as signale from 'signale';
import { ARGS, FLAGS } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = { port: FLAGS.port };
  public static args = [ARGS.spec];

  public async run() {
    const i = new signale.Signale({ interactive: true });

    i.await('Starting Prism…');

    const {
      flags: { port },
      args: { spec },
    } = this.parse(Server);

    const server = createServer(spec, { mock: true });
    const address = await server.listen(port);

    if (server.prism.resources.length === 0) {
      i.fatal('No operations found in the current file.');
      this.exit(1);
    }

    i.success(`Prism is listening on ${address}`);

    server.prism.resources.forEach(resource => {
      signale.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
    });
  }
}
