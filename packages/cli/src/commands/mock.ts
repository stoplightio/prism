import { Command } from '@oclif/command';
import { createLogger, logLevels } from '@stoplight/prism-core';
import chalk from 'chalk';
import * as cluster from 'cluster';
import { LogDescriptor } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { ARGS, FLAGS, LOG_COLOR_MAP } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = { port: FLAGS.port, host: FLAGS.host, dynamic: FLAGS.dynamic };
  public static args = [ARGS.spec];

  public async run() {
    const {
      flags: { port, dynamic, host },
      args: { spec },
    } = this.parse(Server);

    if (cluster.isMaster) {
      cluster.setupMaster({ silent: true });

      const signaleInteractiveInstance = new signale.Signale({ interactive: true });
      signaleInteractiveInstance.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

      if (dynamic) {
        signale.star({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Dynamic example generation enabled.' });
      }

      const worker = cluster.fork();

      if (worker.process.stdout) {
        worker.process.stdout.pipe(split(JSON.parse)).on('data', (logLine: LogDescriptor) => {
          const logLevelType = logLevels.labels[logLine.level];

          let prefix = LOG_COLOR_MAP[logLine.name].black(`[${logLine.name}]`);

          if (logLine.input) {
            const { method, url } = logLine.input;
            prefix = prefix.concat(' ' + chalk.bold.white(`${method} ${url.path}`));
          }

          signale[logLevelType]({ prefix, message: logLine.msg });
        });
      }
    } else {
      const pino = createLogger('CLI');
      const server = createServer(spec, { mock: { dynamic } });
      try {
        const address = await server.listen(port, host);

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
