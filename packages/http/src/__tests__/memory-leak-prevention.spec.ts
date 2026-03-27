import { createClientFromOperations, PrismHttp } from '../client';
import { httpOperations } from './fixtures';
import { createTestLogger } from './test-helpers';

describe('Checks if memory leaks', () => {
  function round(client: PrismHttp) {
    return client.post(
      '/todos?overwrite=yes',
      {
        name: 'some name',
        completed: false,
      },
      { headers: { 'x-todos-publish': '2021-09-21T09:48:48.108Z' } }
    );
  }

  it('when handling 5k of requests', () => {
    const logger = createTestLogger();
    const client = createClientFromOperations(httpOperations, {
      validateRequest: true,
      validateResponse: true,
      checkSecurity: true,
      errors: true,
      mock: {
        dynamic: false,
      },
      upstreamProxy: undefined,
      logger,
      isProxy: false,
    });

    round(client);
    const baseMemoryUsage = process.memoryUsage().heapUsed;

    for (let i = 0; i < 5000; i++) {
      round(client);
      if (i % 100 === 0) {
        global.gc!();
      }
    }

    global.gc!();
    expect(process.memoryUsage().heapUsed).toBeLessThanOrEqual(baseMemoryUsage * 1.03);
  });
});
