import { createLogger, logLevels } from '@stoplight/prism-core';
import { IHttpConfig, IHttpProxyConfig } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import { IHttpOperation } from '@stoplight/types';
import chalk from 'chalk';
import * as cluster from 'cluster';
import { LogDescriptor, Logger } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';

async function createMultiProcessPrism(options: CreateBaseServerOptions) {
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

async function createSingleProcessPrism(options: CreateBaseServerOptions) {
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

async function createPrismServerWithLogger(options: CreateBaseServerOptions, logInstance: Logger) {
  if (options.operations.length === 0) {
    throw new Error('No operations found in the current file.');
  }

  const config: IHttpProxyConfig | IHttpConfig = isProxyServerOptions(options)
    ? {
        mock: false,
        validateRequest: true,
        validateResponse: true,
        checkSecurity: true,
        upstream: options.upstream,
        log: options.log,
      }
    : {
        mock: { dynamic: options.dynamic },
        validateRequest: true,
        validateResponse: true,
        checkSecurity: true,
      };

  const server = createHttpServer(options.operations, {
    cors: options.cors,
    config,
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
  });

  const address = await server.listen(options.port, options.host);

  options.operations.forEach(op => logInstance.note(`${op.method.toUpperCase().padEnd(10)} ${address}${op.path}`));
  logInstance.start(`Prism is listening on ${address}`);
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

function isProxyServerOptions(options: CreateBaseServerOptions): options is CreateProxyServerOptions {
  return !options.dynamic && 'log' in options;
}

type CreateBaseServerOptions = {
  dynamic: boolean;
  cors: boolean;
  host: string;
  port: number;
  operations: IHttpOperation[];
  multiprocess: boolean;
};

export interface CreateProxyServerOptions extends CreateBaseServerOptions {
  dynamic: false;
  upstream: URL;
  log: 'stdout' | 'httpResponse' | 'httpHeaders';
}

export type CreateMockServerOptions = CreateBaseServerOptions;

export { createMultiProcessPrism, createSingleProcessPrism };
