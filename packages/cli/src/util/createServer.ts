import { createLogger, logLevels } from '@stoplight/prism-core';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import { IHttpOperation } from '@stoplight/types';
import chalk from 'chalk';
import * as cluster from 'cluster';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';

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
    return createPrismServerWithLogger(options, logInstance);
  }
}

export function createSingleProcessPrism(options: CreatePrismOptions) {
  signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

  const logStream = new PassThrough();
  const logInstance = createLogger('CLI', undefined, logStream);
  pipeOutputToSignale(logStream);
  return createPrismServerWithLogger(options, logInstance);
}

async function createPrismServerWithLogger(options: CreatePrismOptions, logInstance: Logger) {
  if (options.operations.length === 0) {
    logInstance.fatal('No operations found in the current file.');
    cluster.worker.kill();
  }

  const server = createHttpServer(options.operations, {
    config: { cors: options.cors, mock: { dynamic: options.dynamic } },
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
  });

  try {
    const address = await server.listen(options.port, options.host);
    options.operations.forEach(resource => {
      logInstance.note(`${resource.method.toUpperCase().padEnd(10)} ${address}${resource.path}`);
    });
    logInstance.start(`Prism is listening on ${address}`);
  } catch (e) {
    logInstance.fatal(e.message);
    cluster.worker.kill();
  }
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
