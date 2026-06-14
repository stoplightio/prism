import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter as OTLPHttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPTraceExporter as OTLPGrpcTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter as OTLPHttpMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPMetricExporter as OTLPGrpcMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader, type PushMetricExporter } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';

export type OtlpProtocol = 'http/protobuf' | 'grpc';

export interface ITelemetryConfig {
  /** Whether OpenTelemetry tracing is enabled. When false, initTelemetry is a no-op. */
  enabled: boolean;
  /** OTLP collector endpoint, e.g. http://localhost:4318/v1/traces. Falls back to OTEL_EXPORTER_OTLP_ENDPOINT. */
  exporterUrl?: string;
  /** service.name reported to the collector. Falls back to OTEL_SERVICE_NAME, then 'prism'. */
  serviceName?: string;
  /**
   * OTLP transport. Falls back to OTEL_EXPORTER_OTLP_PROTOCOL, then 'http/protobuf'.
   * 'grpc' uses the OTLP/gRPC exporter (collector gRPC port, e.g. :4317).
   */
  protocol?: OtlpProtocol;
  /**
   * Whether to export metrics alongside traces: Prism request metrics (count + latency histogram)
   * plus Node.js VM metrics (event loop, GC, heap). Defaults to false.
   */
  metrics?: boolean;
}

export interface ITelemetry {
  /** Flush and shut down the OpenTelemetry SDK, ensuring buffered spans are exported. */
  shutdown: () => Promise<void>;
}

const NOOP_TELEMETRY: ITelemetry = {
  shutdown: () => Promise.resolve(),
};

/**
 * Builds an OTLP metric exporter for the given protocol. For HTTP, derives the /v1/metrics URL
 * from an explicit trace url (e.g. one ending in /v1/traces) so a single endpoint covers both
 * signals; gRPC multiplexes signals over one endpoint so the url is passed through unchanged.
 */
function buildMetricExporter(protocol: OtlpProtocol, exporterUrl?: string): PushMetricExporter {
  if (protocol === 'grpc') {
    return new OTLPGrpcMetricExporter(exporterUrl ? { url: exporterUrl } : {});
  }

  const metricsUrl = exporterUrl ? exporterUrl.replace(/\/v1\/traces$/, '/v1/metrics') : undefined;
  return new OTLPHttpMetricExporter(metricsUrl ? { url: metricsUrl } : {});
}

/**
 * Initializes the OpenTelemetry Node SDK with an OTLP trace exporter (HTTP/protobuf or gRPC,
 * per config.protocol), optional request metrics, and HTTP auto-instrumentation. Returns a
 * no-op handle when disabled.
 *
 * For auto-instrumentation of outbound calls (proxy mode) to patch reliably, this must run
 * before the instrumented modules (`http`, `node-fetch`) are first required.
 */
export function initTelemetry(config: ITelemetryConfig): ITelemetry {
  if (!config.enabled) {
    return NOOP_TELEMETRY;
  }

  const serviceName = config.serviceName || process.env.OTEL_SERVICE_NAME || 'prism';
  const protocol = config.protocol || (process.env.OTEL_EXPORTER_OTLP_PROTOCOL as OtlpProtocol) || 'http/protobuf';

  // When no url is provided each exporter falls back to OTEL_EXPORTER_OTLP_ENDPOINT and its defaults.
  const traceExporterOptions = config.exporterUrl ? { url: config.exporterUrl } : {};
  const traceExporter: SpanExporter =
    protocol === 'grpc'
      ? new OTLPGrpcTraceExporter(traceExporterOptions)
      : new OTLPHttpTraceExporter(traceExporterOptions);

  // Metrics use a separate OTLP signal path. If an explicit trace url was given (e.g. ending in
  // /v1/traces), derive the metrics url (/v1/metrics) so a single --otel-exporter-url works for both.
  const metricReader = config.metrics
    ? new PeriodicExportingMetricReader({ exporter: buildMetricExporter(protocol, config.exporterUrl) })
    : undefined;

  const instrumentations: Instrumentation[] = [new HttpInstrumentation()];
  // When metrics are enabled, also collect Node.js VM metrics: event loop delay/utilization,
  // garbage collection duration, and V8 heap usage. Emitted through the same metric reader.
  if (config.metrics) {
    instrumentations.push(new RuntimeNodeInstrumentation());
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter,
    ...(metricReader ? { metricReader } : {}),
    instrumentations,
  });

  sdk.start();

  return {
    shutdown: () => sdk.shutdown(),
  };
}
