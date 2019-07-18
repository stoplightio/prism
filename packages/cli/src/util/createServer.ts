import { createLogger, HttpLoader, logLevels } from '@stoplight/prism-core';
import { IHttpConfig } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import chalk from 'chalk';
import * as cluster from 'cluster';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';

export function createServer(spec: string, config: IHttpConfig, logger: Logger) {
  return spec && isHttp(spec)
    ? createHttpServer({ url: spec }, { components: { loader: new HttpLoader(), logger }, config })
    : createHttpServer({ path: spec }, { config, components: { logger } });
}

export async function createMultiProcessPrism(options: CreatePrismOptions) {
  if (cluster.isMaster) {
    cluster.setupMaster({ silent: true });

    signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

    if (options.dynamic) {
      logCLIMessage(`Dynamic example generation ${chalk.green('enabled')}.`);
    }

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

  if (options.dynamic) {
    logCLIMessage(`Dynamic example generation ${chalk.green('enabled')}.`);
  }

  const logStream = new PassThrough();
  const logInstance = createLogger('CLI', undefined, logStream);
  pipeOutputToSignale(logStream);
  return createPrismServerWithLogger(options, logInstance);
}

async function createPrismServerWithLogger(options: CreatePrismOptions, logInstance: Logger) {
  const server = createServer(
    options.spec,
    { mock: { dynamic: options.dynamic } },
    logInstance.child({ name: 'HTTP SERVER' }),
  );
  try {
    const address = await server.listen(options.port, options.host);
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

function logCLIMessage(message: string) {
  signale.star({
    prefix: chalk.bgWhiteBright.black('[CLI]'),
    message,
  });
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}

export type CreatePrismOptions = {
  dynamic: boolean;
  host?: string;
  port: number;
  spec: string;
};
