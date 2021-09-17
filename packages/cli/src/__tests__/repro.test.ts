import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { isLeft } from 'fp-ts/lib/Either';

import route from 'http/src/router';
import { validateInput, validateOutput } from 'http/src/validator';
import { getHttpOperationsFromSpec } from 'cli/src/operations';

const myglobal = {
  gc: () => {
    return;
  },
};

const spec = {
  openapi: '3.0.0',
  paths: {
    '/specific/echo/tests/{test_id}': {
      post: {
        summary: 'Echo',
        description: 'Cf. summary',
        parameters: [
          {
            name: 'authorization',
            description: 'Bearer token.',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
              format: 'JSON Web Token RFC 7519',
              maxLength: 4000,
            },
          },
          {
            name: 'x-environment',
            in: 'header',
            description: 'Header x-environment',
            schema: {
              type: 'string',
              enum: ['test', 'prod'],
            },
          },
          {
            name: 'complete',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['false', 'no'],
            },
          },
          {
            name: 'x-tenant-id',
            description: 'The unique identifier of the tenant',
            in: 'header',
            required: true,
            schema: {
              type: 'string',
              maxLength: 50,
            },
          },
          {
            name: 'test_id',
            description: 'Identifier of the test',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              maxLength: 150,
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Your request back.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '400': {
            description: 'Bad Request.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    error: {
                      type: 'string',
                      maxLength: 50,
                    },
                    error_description: {
                      type: 'string',
                      maxLength: 4000,
                    },
                    status_code: {
                      type: 'string',
                      maxLength: 3,
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized (JWT not valid).',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    error: {
                      type: 'string',
                      maxLength: 50,
                    },
                    error_description: {
                      type: 'string',
                      maxLength: 4000,
                    },
                    status_code: {
                      type: 'string',
                      maxLength: 3,
                    },
                  },
                },
              },
            },
          },
          '403': {
            description: "Forbidden (doesn't have the valid scope).",
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    error: {
                      type: 'string',
                      maxLength: 50,
                    },
                    error_description: {
                      type: 'string',
                      maxLength: 4000,
                    },
                    status_code: {
                      type: 'string',
                      maxLength: 3,
                    },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Not Found (Resource not found).',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    error: {
                      type: 'string',
                      maxLength: 50,
                    },
                    error_description: {
                      type: 'string',
                      maxLength: 4000,
                    },
                    status_code: {
                      type: 'string',
                      maxLength: 3,
                    },
                  },
                },
              },
            },
          },
          default: {
            description: 'Default response format.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    error: {
                      type: 'string',
                      maxLength: 50,
                    },
                    error_description: {
                      type: 'string',
                      maxLength: 4000,
                    },
                    status_code: {
                      type: 'string',
                      maxLength: 3,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

it('repro', async () => {
  const resources = await getHttpOperationsFromSpec(spec);

  const inputRequest: IHttpRequest = {
    method: 'post',
    url: {
      path: '/specific/echo/tests/something',
      baseUrl: undefined,
      query: {
        complete: 'true',
      },
    },
    body: '1',
    headers: { 'x-tenant-id': 'north-eu' },
  };

  const inputResponse: IHttpResponse = {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: {
      now: 1631006011556,
    },
  };

  const path = __dirname + '/out.tsv';
  writeFileSync(path, 'i\tHeapUsed\r\n', 'utf8');

  const r = route({ resources, input: inputRequest });
  if (isLeft(r)) {
    throw new Error('Unmatched request');
  }

  const resource = r.right;

  myglobal.gc();

  for (let i = 0; i < 1000; i++) {
    validateInput({ resource, element: inputRequest });
    validateOutput({ resource, element: inputResponse });

    if (i % 10 === 0) {
      const mem = process.memoryUsage();
      myglobal.gc();
      appendFileSync(path, `${i}\t${mem.heapUsed}\r\n`);
    }
  }

  console.log();

  const content = readFileSync(path, 'utf8');
  console.log(content);
});
