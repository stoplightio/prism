import getHttpOperations from '@stoplight/prism-cli/src/util/getHttpOperations';
import { createLogger } from '@stoplight/prism-core';
import * as fastify from 'fastify';
import { relative, resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

const logger = createLogger('TEST', { enabled: false });

async function instantiatePrism(fixture: string) {
  const path = relative(process.cwd(), resolve(__dirname, 'fixtures', fixture));
  const operations = await getHttpOperations(path);
  const server = createServer(operations, { components: { logger }, config: { mock: { dynamic: false } } });
  return server;
}

describe('body params validation', () => {
  let server: IPrismHttpServer;

  afterAll(async () => {
    await server.fastify.close();
  });

  describe('oas3 with encodings', () => {
    beforeEach(async () => {
      server = await instantiatePrism(`encodings.oas3.yaml`);
    });

    // Ref: https://github.com/stoplightio/prism/issues/496
    test.skip('allowReserved set to true', async () => {
      const response = await server.fastify.inject({
        method: 'POST',
        url: '/allowReserved',
        payload: {
          reserved: ":/?#[]@!$&'()*+,;",
        },
      });

      expect(response.statusCode).toEqual(422);
    });
  });

  describe.each([['oas2'], ['oas3']])('%s with body param', oas => {
    beforeEach(async () => {
      server = await instantiatePrism(`operations-with-body-param.${oas}.yaml`);
    });

    describe('operation with no request content type defined', () => {
      const operation: fastify.HTTPInjectOptions = {
        method: 'POST',
        url: '/json-body-no-request-content-type',
      };

      describe('property type invalid', () => {
        test('returns 422 & error message', async () => {
          const response = await server.fastify.inject({
            ...operation,
            payload: {
              id: 'string',
            },
          });

          expect(response.statusCode).toBe(422);
          expect(JSON.parse(response.payload)).toMatchObject({
            validation: [
              {
                code: 'type',
                location: ['body', 'id'],
                message: 'should be integer',
                severity: 'Error',
              },
            ],
          });
        });
      });
    });

    describe('operation with required property', () => {
      const operation: fastify.HTTPInjectOptions = {
        method: 'POST',
        url: '/json-body-property-required',
      };

      describe('when property not provided', () => {
        test('returns 422 & error message', async () => {
          const response = await server.fastify.inject({
            ...operation,
            payload: {},
          });

          expect(response.statusCode).toBe(422);
          expect(JSON.parse(response.payload)).toMatchObject({
            validation: [{ code: 'required', message: "should have required property 'id'", severity: 'Error' }],
          });
        });
      });
    });

    describe('operation with optional body', () => {
      describe('when no body provided', () => {
        test('returns 200', async () => {
          const response = await server.fastify.inject({
            method: 'POST',
            url: '/json-body-optional',
          });

          expect(response.statusCode).toBe(200);
        });
      });
    });

    describe('operation with required body', () => {
      const operation: fastify.HTTPInjectOptions = {
        method: 'POST',
        url: '/json-body-required',
      };

      describe('when no body provided', () => {
        test('returns 422 & error message', async () => {
          const response = await server.fastify.inject(operation);

          expect(response.statusCode).toBe(422);
          expect(JSON.parse(response.payload)).toMatchObject({
            validation: [{ code: 'required', message: 'Body parameter is required', severity: 'Error' }],
          });
        });
      });

      describe('when body provided', () => {
        describe('and is valid', () => {
          // Ref: https://github.com/stoplightio/prism/issues/500
          test.skip('returns 200', async () => {
            const response = await server.fastify.inject({
              ...operation,
              payload: {
                id: 123,
              },
            });

            expect(response.statusCode).toBe(200);
            expect(response.payload).toBe('string');
          });
        });

        describe('and property type invalid', () => {
          test('returns 422 & error message', async () => {
            const response = await server.fastify.inject({
              ...operation,
              payload: {
                id: 'string',
              },
            });

            expect(response.statusCode).toBe(422);
            expect(JSON.parse(response.payload)).toMatchObject({
              validation: [
                {
                  code: 'type',
                  location: ['body', 'id'],
                  message: 'should be integer',
                  severity: 'Error',
                },
              ],
            });
          });
        });

        describe('and property not one of enum', () => {
          test('returns 422 & error message', async () => {
            const response = await server.fastify.inject({
              ...operation,
              payload: {
                status: 'string',
              },
            });

            expect(response.statusCode).toBe(422);
            expect(JSON.parse(response.payload)).toMatchObject({
              validation: [
                {
                  code: 'enum',
                  location: ['body', 'status'],
                  message: 'should be equal to one of the allowed values',
                  severity: 'Error',
                },
              ],
            });
          });
        });
      });
    });
  });

  describe.each([['oas2'], ['oas3']])('%s with form data param', oas => {
    beforeEach(async () => {
      server = await instantiatePrism(`operations-with-formdata-param.${oas}.yaml`);
    });

    describe('required parameter not in body', () => {
      test('returns 422', async () => {
        const response = await server.fastify.inject({
          method: 'POST',
          url: '/path',
          payload: {},
        });

        expect(response.statusCode).toBe(422);
        const parsed = JSON.parse(response.payload);
        expect(parsed).toMatchObject({
          type: 'https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY',
          validation: [
            {
              location: ['body'],
              severity: 'Error',
              code: 'required',
              message: "should have required property 'id'",
            },
            {
              location: ['body'],
              severity: 'Error',
              code: 'required',
              message: "should have required property 'status'",
            },
          ],
        });
      });
    });

    describe('parameter does not match enum criteria', () => {
      test('returns 422 & proper validation message', async () => {
        const response = await server.fastify.inject({
          method: 'POST',
          url: '/path',
          payload: {
            id: 'not integer',
            status: 'somerundomestuff',
          },
        });

        expect(response.statusCode).toBe(422);
        const parsed = JSON.parse(response.payload);
        expect(parsed).toMatchObject({
          type: 'https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY',
          validation: [
            {
              location: ['body', 'id'],
              severity: 'Error',
              code: 'type',
              message: 'should be integer',
            },
            {
              location: ['body', 'status'],
              severity: 'Error',
              code: 'enum',
              message: 'should be equal to one of the allowed values',
            },
          ],
        });
      });
    });

    describe('valid parameter provided', () => {
      test('returns 200', async () => {
        const response = await server.fastify.inject({
          method: 'POST',
          url: '/path',
          payload: {
            id: 123,
            status: 'open',
          },
        });

        expect(response.statusCode).toBe(200);
      });
    });
  });
});
