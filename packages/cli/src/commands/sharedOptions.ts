import { Dictionary } from '@stoplight/types';
import { Options } from 'yargs';
import * as pino from 'pino';

const sharedOptions: Dictionary<Options> = {
  port: {
    alias: 'p',
    description: 'Port that Prism will run on.',
    default: 4010,
    demandOption: true,
    number: true,
  },

  host: {
    alias: 'h',
    description: 'Host that Prism will listen to.',
    default: '127.0.0.1',
    demandOption: true,
    string: true,
  },

  cors: {
    description: 'Enables CORS headers.',
    boolean: true,
    default: true,
  },

  multiprocess: {
    alias: 'm',
    description: 'Forks the http server from the CLI for faster log processing.',
    boolean: true,
    default: process.env.NODE_ENV === 'production',
  },

  errors: {
    description: 'Specifies whether request/response violations marked as errors will produce an error response',
    required: true,
    boolean: true,
    default: false,
  },

  verboseLevel: {
    alias: 'v',
    description: 'Turns on verbose logging.',
    default: 'info',
    demandOption: true,
    // log level choices: "silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace"
    // custom levels like "success" and "start" are set to the same severity value as "info"
    choices: Object.keys(pino.levels.values).concat('silent'),
  },

  'otel-telemetry': {
    description:
      'Enable OpenTelemetry: exports traces and metrics (request count + latency, and Node.js VM metrics: event loop, GC, heap). Can also be enabled with the PRISM_TELEMETRY env var.',
    boolean: true,
    default: false,
  },

  'otel-exporter-url': {
    description:
      'OTLP collector endpoint, e.g. http://localhost:4318/v1/traces. Falls back to the OTEL_EXPORTER_OTLP_ENDPOINT env var.',
    string: true,
  },

  'otel-service-name': {
    description: 'service.name reported to the collector. Falls back to the OTEL_SERVICE_NAME env var, then "prism".',
    string: true,
    default: 'prism',
  },

  'otel-exporter-protocol': {
    description:
      'OTLP transport for traces and metrics. Falls back to the OTEL_EXPORTER_OTLP_PROTOCOL env var, then "http/protobuf".',
    string: true,
    choices: ['http/protobuf', 'grpc'],
    default: 'http/protobuf',
  },
};

export default sharedOptions;
