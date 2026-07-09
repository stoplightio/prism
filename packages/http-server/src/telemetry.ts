import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface ITelemetryConfig {
  /** Whether OpenTelemetry tracing is enabled. When false, initTelemetry is a no-op. */
  enabled: boolean;
  /** OTLP collector endpoint, e.g. http://localhost:4318/v1/traces. Falls back to OTEL_EXPORTER_OTLP_ENDPOINT. */
  exporterUrl?: string;
  /** service.name reported to the collector. Falls back to OTEL_SERVICE_NAME, then 'prism'. */
  serviceName?: string;
}

export interface ITelemetry {
  /** Flush and shut down the OpenTelemetry SDK, ensuring buffered spans are exported. */
  shutdown: () => Promise<void>;
}

const NOOP_TELEMETRY: ITelemetry = {
  shutdown: () => Promise.resolve(),
};

/**
 * Initializes the OpenTelemetry Node SDK with an OTLP/HTTP trace exporter and HTTP
 * auto-instrumentation. Returns a no-op handle when telemetry is disabled.
 *
 * For auto-instrumentation of outbound calls (proxy mode) to patch reliably, this must run
 * before the instrumented modules (`http`, `node-fetch`) are first required.
 */
export function initTelemetry(config: ITelemetryConfig): ITelemetry {
  if (!config.enabled) {
    return NOOP_TELEMETRY;
  }

  const serviceName = config.serviceName || process.env.OTEL_SERVICE_NAME || 'prism';

  const traceExporter = new OTLPTraceExporter(
    // When no url is provided the exporter falls back to OTEL_EXPORTER_OTLP_ENDPOINT and its defaults.
    config.exporterUrl ? { url: config.exporterUrl } : {}
  );

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter,
    instrumentations: [new HttpInstrumentation()],
  });

  sdk.start();

  return {
    shutdown: () => sdk.shutdown(),
  };
}
