import { createLogger } from '@stoplight/prism-core';
import { IHttpConfig, IHttpProxyConfig, getHttpOperationsFromResource } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import chalk from 'chalk';
import * as cluster from 'cluster';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { LogDescriptor, Logger, LoggerOptions } from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';
import { createExamplePath } from './paths';
import { attachTagsToParamsValues, transformPathParamsValues } from './colorizer';

signale.config({ displayTimestamp: true });

const cliSpecificLoggerOptions: LoggerOptions = {
  useLevelLabels: true,
};

async function createMultiProcessPrism(options: CreateBaseServerOptions) {
  if (cluster.isMaster) {
    cluster.setupMaster({ silent: true });

    signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

    const worker = cluster.fork();

    if (worker.process.stdout) {
      pipeOutputToSignale(worker.process.stdout);
    }

    return;
  } else {
    const logInstance = createLogger('CLI', { ...cliSpecificLoggerOptions, level: options.verbose ? 'debug' : 'info' });
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
  const logInstance = createLogger(
    'CLI',
    { ...cliSpecificLoggerOptions, level: options.verbose ? 'debug' : 'info' },
    logStream
  );
  pipeOutputToSignale(logStream);

  try {
    return await createPrismServerWithLogger(options, logInstance);
  } catch (e) {
    logInstance.fatal(e.message);
  }
}

async function createPrismServerWithLogger(options: CreateBaseServerOptions, logInstance: Logger) {
  const operations = await getHttpOperationsFromResource(options.document);

  if (operations.length === 0) {
    throw new Error('No operations found in the current file.');
  }

  const shared: Omit<IHttpConfig, 'mock'> = {
    validateRequest: true,
    validateResponse: true,
    checkSecurity: true,
    errors: false,
  };

  const config: IHttpProxyConfig | IHttpConfig = isProxyServerOptions(options)
    ? { ...shared, mock: false, upstream: options.upstream }
    : { ...shared, mock: { dynamic: options.dynamic } };

  const server = createHttpServer(operations, {
    cors: options.cors,
    config,
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
    errors: options.errors,
  });

  const address = await server.listen(options.port, options.host);

  operations.forEach(resource => {
    const path = pipe(
      createExamplePath(resource, attachTagsToParamsValues),
      Either.getOrElse(() => resource.path)
    );

    logInstance.info(
      `${resource.method.toUpperCase().padEnd(10)} ${address}${transformPathParamsValues(path, chalk.bold.cyan)}`
    );
  });

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
    signale[logLine.level]({ prefix: constructPrefix(logLine), message: logLine.msg });
  });
}

function isProxyServerOptions(options: CreateBaseServerOptions): options is CreateProxyServerOptions {
  return 'upstream' in options;
}

type CreateBaseServerOptions = {
  dynamic: boolean;
  cors: boolean;
  host: string;
  port: number;
  document: string;
  multiprocess: boolean;
  errors: boolean;
  verbose: boolean;
};

export interface CreateProxyServerOptions extends CreateBaseServerOptions {
  dynamic: false;
  upstream: URL;
}

export type CreateMockServerOptions = CreateBaseServerOptions;

export { createMultiProcessPrism, createSingleProcessPrism };
