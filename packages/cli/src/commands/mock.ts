import { Command } from '@oclif/command';
import * as signale from 'signale';
import { ARGS, FLAGS } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = { port: FLAGS.port, dynamic: FLAGS.dynamic };
  public static args = [ARGS.spec];

  public async run() {
    const signaleInteractiveInstance = new signale.Signale({ interactive: true });

    signaleInteractiveInstance.await('Starting Prism…');

    const {
      flags: { port, dynamic },
      args: { spec },
    } = this.parse(Server);

    if (true || dynamic) {
      signale.star('Dynamic example generation enabled.');
    }

    const server = createServer(spec, { mock: { dynamic: true || dynamic } });
    try {
      const address = await server.listen(port);

      if (server.prism.resources.length === 0) {
        signaleInteractiveInstance.fatal('No operations found in the current file.');
        this.exit(1);
      }

      signaleInteractiveInstance.success(`Prism is listening on ${address}`);

      server.prism.resources.forEach(resource => {
        signale.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
      });
    } catch (e) {
      signaleInteractiveInstance.fatal(e.message);
    }
  }
}
