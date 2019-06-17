import { Command } from '@oclif/command';
import { createLogger, logLevels } from '@stoplight/prism-core';
import chalk from 'chalk';
import * as cluster from 'cluster';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { ARGS, FLAGS, LOG_COLOR_MAP } from '../const/options';
import { createServer } from '../util/createServer';

export default class Server extends Command {
  public static description = 'Start a mock server with the given spec file';
  public static flags = FLAGS;
  public static args = [ARGS.spec];

  public async run() {
    const {
      flags: { port, dynamic, host, multiprocess },
      args: { spec },
    } = this.parse(Server);

    if (cluster.isMaster) {
      cluster.setupMaster({ silent: true });

      const signaleInteractiveInstance = new signale.Signale({ interactive: true });
      signaleInteractiveInstance.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

      if (dynamic) {
        signale.star({
          prefix: chalk.bgWhiteBright.black('[CLI]'),
          message: `Dynamic example generation ${chalk.green('enabled')}.`,
        });
      }

      if (multiprocess) {
        signale.star({
          prefix: chalk.bgWhiteBright.black('[CLI]'),
          message: `Multi process ${chalk.green('enabled')}.`,
        });

        const worker = cluster.fork();

        if (worker.process.stdout) {
          pipeOutputToSignale(worker.process.stdout);
        }
      } else {
        const logStream = new PassThrough();
        const logInstance = createLogger('CLI', undefined, logStream);
        pipeOutputToSignale(logStream);
        await createPrismServerWithLogger(spec, dynamic, port, host, logInstance);
      }
    } else if (multiprocess && cluster.isWorker) {
      const logInstance = createLogger('CLI');
      await createPrismServerWithLogger(spec, dynamic, port, host, logInstance);
    }
  }
}

async function createPrismServerWithLogger(
  spec: any,
  dynamic: boolean,
  port: number,
  host: string | undefined,
  logInstance: Logger,
) {
  const server = createServer(spec, { mock: { dynamic } }, logInstance.child({ name: 'HTTP SERVER' }));
  try {
    const address = await server.listen(port, host);
    if (server.prism.resources.length === 0) {
      logInstance.fatal('No operations found in the current file.');
      cluster.worker.kill();
    }
    server.prism.resources.forEach(resource => {
      logInstance.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
    });
    logInstance.start(`Prism is listening on ${address}`);
  } catch (e) {
    logInstance.fatal(e.message);
    cluster.worker.kill();
  }
}

function pipeOutputToSignale(stream: Readable) {
  stream.pipe(split(JSON.parse)).on('data', (logLine: LogDescriptor) => {
    const logLevelType = logLevels.labels[logLine.level];

    let prefix = LOG_COLOR_MAP[logLine.name].black(`[${logLine.name}]`);

    if (logLine.input) {
      const { method, url } = logLine.input;
      prefix = prefix.concat(' ' + chalk.bold.white(`${method} ${url.path}`));
    }

    signale[logLevelType]({ prefix, message: logLine.msg });
  });
}
