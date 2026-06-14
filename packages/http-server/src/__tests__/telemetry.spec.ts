import { initTelemetry } from '../telemetry';

describe('initTelemetry', () => {
  describe('when disabled', () => {
    it('returns a no-op handle without starting the SDK', async () => {
      const telemetry = initTelemetry({ enabled: false });

      // shutdown should resolve immediately and not throw
      await expect(telemetry.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('when enabled', () => {
    let telemetry: ReturnType<typeof initTelemetry>;

    afterEach(async () => {
      if (telemetry) {
        await telemetry.shutdown();
      }
    });

    it('starts the SDK with the default (http/protobuf) exporter and returns a shutdown handle', () => {
      telemetry = initTelemetry({
        enabled: true,
        exporterUrl: 'http://localhost:4318/v1/traces',
        serviceName: 'prism-test',
      });

      expect(typeof telemetry.shutdown).toBe('function');
    });

    it('starts the SDK with the gRPC exporter when protocol is "grpc"', () => {
      telemetry = initTelemetry({
        enabled: true,
        exporterUrl: 'http://localhost:4317',
        serviceName: 'prism-test',
        protocol: 'grpc',
      });

      expect(typeof telemetry.shutdown).toBe('function');
    });
  });
});
