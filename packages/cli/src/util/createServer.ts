import { createLogger } from '@stoplight/prism-core';
import { IHttpConfig, IHttpRequest } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import * as chalk from 'chalk';
import * as cluster from 'cluster';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as pino from 'pino';
import * as signale from 'signale';
import * as split from 'split2';
import { PassThrough, Readable } from 'stream';
import { LOG_COLOR_MAP } from '../const/options';
import { CreatePrism } from './runner';
import { getHttpOperationsFromSpec } from '@stoplight/prism-http';
import { createExamplePath } from './paths';
import { attachTagsToParamsValues, transformPathParamsValues } from './colorizer';
import { configureExtensionsUserProvided } from '../extensions';

type PrismLogDescriptor = pino.LogDescriptor & {
  name: keyof typeof LOG_COLOR_MAP;
  offset?: number;
  input: IHttpRequest;
};

signale.config({ displayTimestamp: true });

const cliSpecificLoggerOptions: pino.LoggerOptions = {
  customLevels: { start: pino.levels.values['info'] + 1 },
  level: 'start',
  formatters: {
    level: level => ({ level }),
  },
};

const createMultiProcessPrism: CreatePrism = async options => {
  if (cluster.isMaster) {
    cluster.setupMaster({ silent: true });

    signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

    const worker = cluster.fork();

    if (worker.process.stdout) {
      pipeOutputToSignale(worker.process.stdout);
    }

    return;
  } else {
    const logInstance = createLogger('CLI', { ...cliSpecificLoggerOptions, level: options.verboseLevel });

    return createPrismServerWithLogger(options, logInstance).catch((e: Error) => {
      logInstance.fatal(e.message);
      cluster.worker.kill();
      throw e;
    });
  }
};

const createSingleProcessPrism: CreatePrism = options => {
  signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

  const logStream = new PassThrough();
  const logInstance = createLogger('CLI', { ...cliSpecificLoggerOptions, level: options.verboseLevel }, logStream);
  pipeOutputToSignale(logStream);

  return createPrismServerWithLogger(options, logInstance).catch((e: Error) => {
    logInstance.fatal(e.message);
    throw e;
  });
};

async function createPrismServerWithLogger(options: CreateBaseServerOptions, logInstance: pino.Logger) {
  const operations = await getHttpOperationsFromSpec(options.document);
  const jsonSchemaFakerCliParams: { [option: string]: any } = {
    ['fillProperties']: options.jsonSchemaFakerFillProperties,
  };
  await configureExtensionsUserProvided(options.document, jsonSchemaFakerCliParams);

  if (operations.length === 0) {
    throw new Error('No operations found in the current file.');
  }

  const validateRequest = isProxyServerOptions(options) ? options.validateRequest : true;
  const shared = {
    validateRequest,
    validateResponse: true,
    checkSecurity: true,
    errors: options.errors,
    upstreamProxy: undefined,
    mock: { dynamic: options.dynamic, ignoreExamples: options.ignoreExamples, seed: options.seed },
  };

  const config: IHttpConfig = isProxyServerOptions(options)
    ? {
        ...shared,
        isProxy: true,
        upstream: options.upstream,
        upstreamProxy: options.upstreamProxy,
      }
    : { ...shared, isProxy: false };

  const server = createHttpServer(operations, {
    cors: options.cors,
    config,
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
  });

  const address = await server.listen(options.port, options.host);
  operations.forEach(resource => {
    const path = pipe(
      createExamplePath(resource, attachTagsToParamsValues),
      E.getOrElse(() => resource.path)
    );

    logInstance.info(
      `${resource.method.toUpperCase().padEnd(10)} ${address}${transformPathParamsValues(path, chalk.bold.cyan)}`
    );
  });
  logInstance.start(`Prism is listening on ${address}`);

  return server;
}

function pipeOutputToSignale(stream: Readable) {
  function constructPrefix(logLine: PrismLogDescriptor): string {
    const logOptions = LOG_COLOR_MAP[logLine.name];
    const prefix = '    '
      .repeat(logOptions.index + (logLine.offset || 0))
      .concat(logOptions.color.black(`[${logLine.name}]`));

    return logLine.input
      ? prefix.concat(' ' + chalk.bold.white(`${logLine.input.method} ${logLine.input.url.path}`))
      : prefix;
  }

  stream.pipe(split(JSON.parse)).on('data', (logLine: PrismLogDescriptor) => {
    signale[logLine.level]({ prefix: constructPrefix(logLine), message: logLine.msg });
  });
}

function isProxyServerOptions(options: CreateBaseServerOptions): options is CreateProxyServerOptions {
  return 'upstream' in options;
}

/**
 * @property {boolean} jsonSchemaFakerFillProperties - Used to override the default json-schema-faker extension value
 */
type CreateBaseServerOptions = {
  dynamic: boolean;
  cors: boolean;
  host: string;
  port: number;
  document: string;
  multiprocess: boolean;
  errors: boolean;
  verboseLevel: string;
  ignoreExamples: boolean;
  seed: string;
  jsonSchemaFakerFillProperties: boolean;
};

export interface CreateProxyServerOptions extends CreateBaseServerOptions {
  upstream: URL;
  validateRequest: boolean;
  upstreamProxy: string | undefined;
}

export type CreateMockServerOptions = CreateBaseServerOptions;

export { createMultiProcessPrism, createSingleProcessPrism };
