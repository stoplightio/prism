import { createLogger } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import fetch, { RequestInit } from 'node-fetch';
import { createServer } from '../';
import { ThenArg } from '../types';

const logger = createLogger('TEST', { enabled: false });

async function instantiatePrism(operations: IHttpOperation[]) {
  const server = createServer(operations, {
    components: { logger },
    cors: true,
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      mock: { dynamic: false },
      errors: false,
    },
  });

  // be careful with selecting the port: it can't be the same in different suite because test suites run in parallel
  const address = await server.listen(30000, '127.0.0.1');

  return {
    close: server.close.bind(server),
    address,
  };
}

describe('body params validation', () => {
  let server: ThenArg<ReturnType<typeof instantiatePrism>>;

  afterEach(() => server.close());

  function makeRequest(url: string, init?: RequestInit) {
    return fetch(new URL(url, server.address), init);
  }

  describe('http operation with body param', () => {
    beforeEach(async () => {
      server = await instantiatePrism([
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
      describe('property type invalid', () => {
        test('returns 422 & error message', async () => {
          const response = await makeRequest('/json-body-no-request-content-type', {
            method: 'POST',
            body: JSON.stringify({ id: 'string' }),
            headers: { 'content-type': 'application/json' },
          });

          expect(response.status).toBe(422);
          return expect(response.json()).resolves.toMatchObject({
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
      describe('when property not provided', () => {
        test('returns 422 & error message', async () => {
          const response = await makeRequest('/json-body-property-required', {
            method: 'POST',
            body: '{}',
            headers: { 'content-type': 'application/json' },
          });

          expect(response.status).toBe(422);
          expect(response.json()).resolves.toMatchObject({
            validation: [{ code: 'required', message: "should have required property 'id'", severity: 'Error' }],
          });
        });
      });
    });

    describe('operation with optional body', () => {
      describe('when no body provided', () => {
        test('returns 200', async () => {
          const response = await makeRequest('/json-body-optional', { method: 'POST' });
          expect(response.status).toBe(200);
        });
      });
    });

    describe('operation with required body', () => {
      describe('when no body provided', () => {
        test('returns 422 & error message', async () => {
          const response = await makeRequest('/json-body-required', { method: 'POST' });
          expect(response.status).toBe(422);
          expect(response.json()).resolves.toMatchObject({
            validation: [{ code: 'required', message: 'Body parameter is required', severity: 'Error' }],
          });
        });
      });

      describe('when body provided', () => {
        describe('and property type invalid', () => {
          test('returns 422 & error message', async () => {
            const response = await makeRequest('/json-body-required', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ id: 'string' }),
            });

            expect(response.status).toBe(422);
            expect(response.json()).resolves.toMatchObject({
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
            const response = await makeRequest('/json-body-required', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ status: 'string' }),
            });

            expect(response.status).toBe(422);
            expect(response.json()).resolves.toMatchObject({
              validation: [
                {
                  code: 'enum',
                  location: ['body', 'status'],
                  message: 'should be equal to one of the allowed values: placed, approved, delivered',
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
    beforeEach(async () => {
      server = await instantiatePrism([
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
        const response = await makeRequest('/path', {
          method: 'POST',
          body: '{}',
          headers: { 'content-type': 'application/json' },
        });

        expect(response.status).toBe(422);
        expect(response.json()).resolves.toMatchObject({
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
        const response = await makeRequest('/path', {
          method: 'POST',
          body: JSON.stringify({
            id: 'not integer',
            status: 'somerundomestuff',
          }),
          headers: { 'content-type': 'application/json' },
        });

        expect(response.status).toBe(422);
        expect(response.json()).resolves.toMatchObject({
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
              message: 'should be equal to one of the allowed values: open, close',
            },
          ],
        });
      });
    });

    describe('valid parameter provided', () => {
      test('returns 200', async () => {
        const response = await makeRequest('/path', {
          method: 'POST',
          body: JSON.stringify({
            id: 123,
            status: 'open',
          }),
          headers: { 'content-type': 'application/json' },
        });

        expect(response.status).toBe(200);
      });
    });
  });
});
