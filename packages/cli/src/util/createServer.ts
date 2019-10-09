import { createLogger, logLevels } from '@stoplight/prism-core';
import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import { IHttpOperation } from '@stoplight/types';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as cluster from 'cluster';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';
import { createExamplePath } from './paths';

export async function createMultiProcessPrism(options: CreatePrismOptions & { spec: string }) {
  if (cluster.isMaster) {
    cluster.setupMaster({ silent: true });

    signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

    const worker = cluster.fork();

    if (worker.process.stdout) {
      pipeOutputToSignale(worker.process.stdout);
    }
  } else {
    const logInstance = createLogger('CLI');
    try {
      return await createPrismServerWithLogger(options, logInstance);
    } catch (e) {
      logInstance.fatal(e.message);
      cluster.worker.kill();
    }
  }
}

export async function createSingleProcessPrism(options: CreatePrismOptions & { spec: string }) {
  signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

  const logStream = new PassThrough();
  const logInstance = createLogger('CLI', undefined, logStream);
  pipeOutputToSignale(logStream);

  try {
    return await createPrismServerWithLogger(options, logInstance);
  } catch (e) {
    logInstance.fatal(e.message);
  }
}

async function createPrismServerWithLogger(options: CreatePrismOptions & { spec: string }, logInstance: Logger) {
  const spec = options.spec;
  const watcher = chokidar.watch(spec);

  let server = await createFastifyServerWithLogger(options, logInstance);

  watcher.on('change', () => {
    logInstance.start('Restarting Prism…');

    server.fastify
      .close()
      .then(() => getHttpOperationsFromResource(spec))
      .then(operations => {
        if (operations.length === 0) {
          logInstance.note('No operations found in the current file. Loading the document from the initial load.');

          return createFastifyServerWithLogger(options, logInstance);
        } else {
          return createFastifyServerWithLogger({ ...options, operations }, logInstance);
        }
      })
      .then(newServer => {
        server = newServer;
      })
      .catch(() => {
        logInstance.fatal('Could not restart the server.');

        process.exit(1);
      });
  });
}

async function createFastifyServerWithLogger(options: CreatePrismOptions, logInstance: Logger) {
  if (options.operations.length === 0) {
    throw new Error('No operations found in the current file.');
  }

  const server = createHttpServer(options.operations, {
    cors: options.cors,
    config: {
      mock: { dynamic: options.dynamic },
      validateRequest: true,
      validateResponse: true,
      checkSecurity: true,
    },
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
  });

  const address = await server.listen(options.port, options.host);

  options.operations.forEach(resource => {
    const path = pipe(
      createExamplePath(resource),
      Either.getOrElse(() => resource.path),
    );

    logInstance.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${path}`);
  });
  logInstance.start(`Prism is listening on ${address}`);

  return server;
}

function pipeOutputToSignale(stream: Readable) {
  function constructPrefix(logLine: LogDescriptor): string {
    const logOptions = LOG_COLOR_MAP[logLine.name];
    const prefix = '    '
      .repeat(logOptions.index + (logLine.offset || 0))
      .concat(logOptions.color.black(`[${logLine.name}]`));

    return logLine.input
      ? prefix.concat(' ' + chalk.bold.white(`${logLine.input.method} ${logLine.input.url.path}`))
      : prefix;
  }

  stream.pipe(split(JSON.parse)).on('data', (logLine: LogDescriptor) => {
    const logLevelType = logLevels.labels[logLine.level];
    signale[logLevelType]({ prefix: constructPrefix(logLine), message: logLine.msg });
  });
}

export type CreatePrismOptions = {
  dynamic: boolean;
  cors: boolean;
  host?: string;
  port: number;
  operations: IHttpOperation[];
};
