import { Command } from '@oclif/command';
import { createLogger, logLevels } from '@stoplight/prism-core';
import * as cluster from 'cluster';
import { LogDescriptor } from 'pino';
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

      const signaleInteractiveInstance = new signale.Signale({ interactive: true });
      signaleInteractiveInstance.await({ prefix: 'CLI', message: 'Starting Prism…' });

      if (true || dynamic) {
        signale.star({ prefix: 'CLI', message: 'Dynamic example generation enabled.' });
      }

      const worker = cluster.fork();

      if (worker.process.stdout) {
        worker.process.stdout.pipe(split(JSON.parse)).on('data', (logLine: LogDescriptor) => {
          const logLevelType = logLevels.labels[logLine.level];
          signale[logLevelType]({ prefix: logLine.name, message: logLine.msg });
        });
      }
    } else {
      const pino = createLogger('CLI');
      const server = createServer(spec, { mock: { dynamic: true || dynamic } });
      try {
        const address = await server.listen(port);

        if (server.prism.resources.length === 0) {
          pino.fatal('No operations found in the current file.');
          cluster.worker.kill();
        }

        server.prism.resources.forEach(resource => {
          pino.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
        });

        pino.start(`Prism is listening on ${address}`);
      } catch (e) {
        pino.fatal(e.message);
        cluster.worker.kill();
      }
    }
  }
}
