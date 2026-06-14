import { createLogger } from '@stoplight/prism-core';
import { IHttpConfig, IHttpRequest } from '@stoplight/prism-http';
import { createServer as createHttpServer, initTelemetry, ITelemetry, OtlpProtocol } from '@stoplight/prism-http-server';
import * as chalk from 'chalk';
// `@types/node` models node:cluster's API as the module's default export, but at runtime (CJS,
// without esModuleInterop) the API lives on the module object itself. Import-equals gives the
// correct runtime object; `.default ?? clusterModule` reconciles the typings with runtime.
import clusterModule = require('node:cluster');
const cluster = (clusterModule as typeof clusterModule & { default?: typeof clusterModule }).default ?? clusterModule;
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
import { jsonrepair } from 'jsonrepair';

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
  if (cluster.isPrimary) {
    cluster.setupPrimary({ silent: true });

    signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Starting Prism…' });

    const worker = cluster.fork();

    if (worker.process.stdout) {
      pipeOutputToSignale(worker.process.stdout);
    }

    // The worker is where telemetry is initialized and where spans are buffered. On shutdown,
    // forward a graceful SIGTERM to the worker so it can flush spans, then exit once it is gone.
    const shutdownWorker = () => {
      worker.once('exit', () => process.exit(0));
      worker.kill('SIGTERM');
    };
    process.once('SIGINT', shutdownWorker);
    process.once('SIGTERM', shutdownWorker);

    return;
  } else {
    const logInstance = createLogger('CLI', { ...cliSpecificLoggerOptions, level: options.verboseLevel });

    return createPrismServerWithLogger(options, logInstance).catch((e: Error) => {
      logInstance.fatal(e.message);
      cluster.worker!.kill();
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

  const telemetryEnabled = options.telemetry || process.env.PRISM_TELEMETRY === 'true';
  if (telemetryEnabled) {
    const telemetry = initTelemetry({
      enabled: true,
      exporterUrl: options.otelExporterUrl,
      serviceName: options.otelServiceName,
      protocol: options.otelExporterProtocol,
    });
    registerTelemetryShutdown(telemetry, logInstance);
  }

  const server = createHttpServer(operations, {
    cors: options.cors,
    config,
    components: { logger: logInstance.child({ name: 'HTTP SERVER' }) },
    telemetry: telemetryEnabled,
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
  stream
    .pipe(
      split(chunk => {
        try {
          const repairedJson = jsonrepair(chunk);
          return JSON.parse(repairedJson);
        } catch {
          signale.await({ prefix: chalk.bgWhiteBright.black('[CLI]'), message: 'Invalid JSON and unable to correct' });
        }
      })
    )
    .on('data', (logLine: PrismLogDescriptor) => {
      signale[logLine.level]({ prefix: constructPrefix(logLine), message: logLine.msg });
    });
}

function isProxyServerOptions(options: CreateBaseServerOptions): options is CreateProxyServerOptions {
  return 'upstream' in options;
}

/**
 * Flushes and shuts down the OpenTelemetry SDK on process termination so that spans buffered by
 * the BatchSpanProcessor are exported instead of being dropped when Prism exits. The `exit`
 * callback is injectable so the shutdown sequence can be unit-tested without terminating the
 * test process.
 */
export function registerTelemetryShutdown(
  telemetry: ITelemetry,
  logInstance: pino.Logger,
  exit: (code: number) => void = code => process.exit(code)
): void {
  let shuttingDown = false;
  const flushAndExit = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    return telemetry
      .shutdown()
      .catch((e: Error) => logInstance.error(`Error shutting down OpenTelemetry: ${e.message}`))
      .finally(() => exit(0));
  };

  process.once('SIGINT', flushAndExit);
  process.once('SIGTERM', flushAndExit);
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
  telemetry: boolean;
  otelExporterUrl?: string;
  otelServiceName?: string;
  otelExporterProtocol?: OtlpProtocol;
};

export interface CreateProxyServerOptions extends CreateBaseServerOptions {
  upstream: URL;
  validateRequest: boolean;
  upstreamProxy: string | undefined;
}

export type CreateMockServerOptions = CreateBaseServerOptions;

export { createMultiProcessPrism, createSingleProcessPrism };
