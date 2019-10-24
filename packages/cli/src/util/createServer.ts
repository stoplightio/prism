import { createLogger, logLevels } from '@stoplight/prism-core';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import { IHttpOperation } from '@stoplight/types';
import chalk from 'chalk';
import * as cluster from 'cluster';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';
import { createExamplePath } from './paths';

export async function createMultiProcessPrism(options: CreatePrismOptions) {
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

export async function createSingleProcessPrism(options: CreatePrismOptions) {
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

async function createPrismServerWithLogger(options: CreatePrismOptions, logInstance: Logger) {
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
      Either.getOrElse(() => resource.path)
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
