import { Command } from '@oclif/command';
import * as cluster from 'cluster';
import * as pino from 'pino';
import { levels, LogDescriptor } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { ARGS, FLAGS } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = { port: FLAGS.port, dynamic: FLAGS.dynamic };
  public static args = [ARGS.spec];

  public async run() {
    const {
      flags: { port, dynamic },
      args: { spec },
    } = this.parse(Server);

    if (cluster.isMaster) {
      cluster.setupMaster({ silent: true });
      levels.labels[10] = 'note';
      levels.values.note = 10;

      const signaleInteractiveInstance = new signale.Signale({ interactive: true });
      signaleInteractiveInstance.await('Starting Prism…');

      if (true || dynamic) {
        signale.star('Dynamic example generation enabled.');
      }

      const worker = cluster.fork();

      if (worker.process.stdout) {
        worker.process.stdout.pipe(split(JSON.parse)).on('data', (logLine: LogDescriptor) => {
          const logLevelType = levels.labels[logLine.level];
          signale[logLevelType](logLine.msg);
        });
      }
    } else {
      const pinoOptions: pino.LoggerOptions = {
        name: 'Prism CLI',
        customLevels: {
          note: 10,
        },
        level: 'note',
        base: null,
        timestamp: false,
      };

      const pinoInstance = pino(pinoOptions);

      const server = createServer(spec, { mock: { dynamic: true || dynamic } });
      try {
        const address = await server.listen(port);

        if (server.prism.resources.length === 0) {
          pinoInstance.fatal('No operations found in the current file.');
          this.exit(1);
        }

        pinoInstance.info(`Prism is listening on ${address}`);

        server.prism.resources.forEach(resource => {
          pinoInstance.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
        });
      } catch (e) {
        pinoInstance.fatal(e.message);
      }
    }
  }
}
