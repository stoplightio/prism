import { createLogger } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import * as fastify from 'fastify';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

const logger = createLogger('TEST', { enabled: false });

function instantiatePrism2(operations: IHttpOperation[]) {
  return createServer(operations, {
    components: { logger },
    cors: true,
    config: { checkSecurity: true, validateRequest: true, validateResponse: true, mock: { dynamic: false } },
  });
}

describe('body params validation', () => {
  let server: IPrismHttpServer;

  afterAll(() => {
    return server.fastify.close();
  });

  describe('http operation with body param', () => {
    beforeEach(async () => {
      server = instantiatePrism2([
        {
          id: '?http-operation-id?',
          method: 'post',
          path: '/json-body-no-request-content-type',
          responses: [
            {
              code: '200',
              headers: [],
              contents: [
                {
                  mediaType: 'text/plain',
                  schema: {
                    type: 'string',
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
          ],
          servers: [],
          request: {
            body: {
              contents: [
                {
                  mediaType: '',
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                        minimum: -9223372036854776000,
                        maximum: 9223372036854776000,
                      },
                    },
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
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
          method: 'post',
          path: '/json-body-optional',
          responses: [
            {
              code: '200',
              headers: [],
              contents: [
                {
                  mediaType: 'text/plain',
                  schema: {
                    type: 'string',
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
          ],
          servers: [],
          request: {
            body: {
              required: false,
              contents: [
                {
                  mediaType: 'application/json',
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                        minimum: -9223372036854776000,
                        maximum: 9223372036854776000,
                      },
                    },
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
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
          method: 'post',
          path: '/json-body-required',
          responses: [
            {
              code: '200',
              headers: [],
              contents: [
                {
                  mediaType: 'text/plain',
                  schema: {
                    type: 'string',
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
          ],
          servers: [],
          request: {
            body: {
              required: true,
              contents: [
                {
                  mediaType: 'application/json',
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                        minimum: -9223372036854776000,
                        maximum: 9223372036854776000,
                      },
                      status: {
                        type: 'string',
                        enum: ['placed', 'approved', 'delivered'],
                      },
                    },
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
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
          method: 'post',
          path: '/json-body-property-required',
          responses: [
            {
              code: '200',
              headers: [],
              contents: [
                {
                  mediaType: 'text/plain',
                  schema: {
                    type: 'string',
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
          ],
          servers: [],
          request: {
            body: {
              contents: [
                {
                  mediaType: 'application/json',
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                        minimum: -9223372036854776000,
                        maximum: 9223372036854776000,
                      },
                    },
                    required: ['id'],
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
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
          test.todo('returns 200');
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

  describe('http operation with form data param', () => {
    beforeEach(() => {
      server = instantiatePrism2([
        {
          id: '?http-operation-id?',
          method: 'post',
          path: '/path',
          responses: [
            {
              code: '200',
              headers: [],
              contents: [
                {
                  mediaType: 'text/plain',
                  schema: {
                    type: 'string',
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
          ],
          servers: [],
          request: {
            body: {
              contents: [
                {
                  mediaType: 'application/x-www-form-urlencoded',
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                      },
                      status: {
                        type: 'string',
                        enum: ['open', 'close'],
                      },
                    },
                    required: ['id', 'status'],
                    $schema: 'http://json-schema.org/draft-04/schema#',
                  },
                  examples: [],
                  encodings: [],
                },
              ],
            },
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
