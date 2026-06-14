import * as pino from 'pino';
import { defaultsDeep } from 'lodash';
import { trace } from '@opentelemetry/api';

/**
 * Adds the active OpenTelemetry span's trace_id/span_id to every log record, enabling log <-> trace
 * correlation. Returns no extra fields when there is no active span (telemetry off, or logging
 * outside a traced request), so it is always safe to use.
 */
function traceContextMixin(): Record<string, string> {
  const spanContext = trace.getActiveSpan()?.spanContext();
  return spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {};
}

export function createLogger(
  name: string,
  overrideOptions: pino.LoggerOptions = {},
  destination?: pino.DestinationStream
): pino.Logger {
  const options: pino.LoggerOptions = defaultsDeep(overrideOptions, {
    name,
    base: {},
    mixin: traceContextMixin,
    customLevels: {
      success: pino.levels.values['info'] + 2,
    },
    level: 'success',
    timestamp: false,
  });

  if (destination) return pino(options, destination);
  return pino(options);
}
