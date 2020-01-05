import { createLogger } from '@stoplight/prism-core';
import { IHttpOperation, HttpParamStyles } from '@stoplight/types';
import * as fastify from 'fastify';
import { createServer } from '..';
import { IPrismHttpServer } from '../types';

const logger = createLogger('TEST', { enabled: false });

function instantiatePrism2(operations: IHttpOperation[]) {
  return createServer(operations, {
    components: { logger },
    cors: true,
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      mock: { dynamic: false },
      errors: false,
    },
    errors: false,
  });
}

describe('header params validity', () => {
  let server: IPrismHttpServer;

  afterAll(() => {
    return server.fastify.close();
  });

  describe('http operation', () => {
    beforeEach(() => {
      server = instantiatePrism2([
        {
          id: '?http-operation-id?',
          method: 'get',
          path: '/chunked-transfer-encoding-response',
          responses: [
            {
              code: '200',
              headers: [
                {
                  name: 'transfer-encoding',
                  style: HttpParamStyles.Simple,
                  schema: {
                    type: 'string',
                    default: 'chunked',
                  },
                },
              ],
            },
          ],
          servers: [],
          request: {
            headers: [],
            query: [],
            cookie: [],
            path: [],
          },
          tags: [],
          security: [],
        },
        {
          id: '?http-operation-id?',
          method: 'get',
          path: '/no-transfer-encoding-in-response',
          responses: [
            {
              code: '200',
              headers: [],
            },
          ],
          servers: [],
          request: {
            headers: [],
            query: [],
            cookie: [],
            path: [],
          },
          tags: [],
          security: [],
        },
      ]);
    });

    describe('operation with "transport-encoding: chunked" header', () => {
      const operation: fastify.HTTPInjectOptions = {
        method: 'GET',
        url: '/chunked-transfer-encoding-response',
      };

      test('is removed by prism', async () => {
        const response = await server.fastify.inject({
          ...operation,
        });
        expect(response.headers['transfer-encoding']).toBeUndefined();
        expect(response.statusCode).toBe(200);
      });
    });

    describe('operation without "transport-encoding" header', () => {
      const operation: fastify.HTTPInjectOptions = {
        method: 'GET',
        url: '/no-transfer-encoding-in-response',
      };

      test('is ignored by prism', async () => {
        const response = await server.fastify.inject({
          ...operation,
        });
        expect(response.headers['transfer-encoding']).toBeUndefined();
        expect(response.statusCode).toBe(200);
      });
    });
  });
});
