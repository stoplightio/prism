import { registerTelemetryShutdown } from '../createServer';
import { ITelemetry } from '@stoplight/prism-http-server';
import { Logger } from 'pino';

describe('registerTelemetryShutdown', () => {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  // Remove any listeners our helper registered so tests don't leak handlers into each other.
  afterEach(() => {
    signals.forEach(signal => process.removeAllListeners(signal));
  });

  const makeLogger = () => ({ error: jest.fn() }) as unknown as Logger;

  it.each(signals)('flushes telemetry and exits when %s is received', async signal => {
    const shutdown = jest.fn(() => Promise.resolve());
    const telemetry: ITelemetry = { shutdown };
    const exit = jest.fn();

    registerTelemetryShutdown(telemetry, makeLogger(), exit);

    // Drive the registered handler and wait for its async flush to settle.
    await Promise.all(process.listeners(signal).map(listener => (listener as () => unknown)()));

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('only flushes once even if multiple signals fire', async () => {
    const shutdown = jest.fn(() => Promise.resolve());
    const exit = jest.fn();

    registerTelemetryShutdown({ shutdown }, makeLogger(), exit);

    await Promise.all(process.listeners('SIGINT').map(listener => (listener as () => unknown)()));
    await Promise.all(process.listeners('SIGTERM').map(listener => (listener as () => unknown)()));

    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('logs an error but still exits when shutdown rejects', async () => {
    const shutdown = jest.fn(() => Promise.reject(new Error('export failed')));
    const logger = makeLogger();
    const exit = jest.fn();

    registerTelemetryShutdown({ shutdown }, logger, exit);

    await Promise.all(process.listeners('SIGTERM').map(listener => (listener as () => unknown)()));

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('export failed'));
    expect(exit).toHaveBeenCalledWith(0);
  });
});
