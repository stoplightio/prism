import { createLogger } from '@stoplight/prism-core';
import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

const logger = createLogger('TEST', { enabled: false });

async function instantiatePrism3(specPath: string) {
  const operations = await getHttpOperationsFromResource(specPath);
  //console.log('op', operations)
  return createServer(operations, {
    components: { logger },
    cors: true,
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      mock: { dynamic: false },
    },
    errors: false,
  });
}

describe('html contenttype example validation', () => {
  let server: IPrismHttpServer;

  beforeAll(async () => {
    server = await instantiatePrism3(resolve(__dirname, 'fixtures', 'content-server-example.oas3.yaml'));
  });

  afterAll(() => {
    return server.fastify.close();
  });

  describe('text html responses are returned', () => {
    it('uses text/html response examples', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pet/html',
        headers: {
          Accept: '*/*',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toMatch('<html><p>Pet Example</p></html>');
    });

    it('uses text/plain response examples', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pet/plain',
        headers: {
          Accept: '*/*',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toMatch('Pet Example');
    });
  });
});
