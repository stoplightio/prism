import Ajv from 'ajv';

import { createLogger } from '@stoplight/prism-core';
import { httpOperations, httpRequests, httpOperationsByRef } from '../../__tests__/fixtures';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import mock from '../index';

const logger = createLogger('TEST', { enabled: false });

describe('http mocker', () => {
  describe('request is valid', () => {
    describe('given only enforced content type', () => {
      test('and that content type exists should first 200 static example', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            mediaTypes: ['text/plain'],
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });

      test('and that content type does not exist should return a 406 error', async () => {
        const mockResult = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            mediaTypes: ['text/funky'],
          },
        })(logger)();

        assertLeft(mockResult, e => expect(e).toHaveProperty('status', 406));
      });
    });

    describe('given enforced status code and contentType and exampleKey', () => {
      test('should return the matching example', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            code: 201,
            exampleKey: 'second',
            mediaTypes: ['application/xml'],
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });
    });

    describe('given enforced status code and contentType', () => {
      test('should return the first matching example', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            code: 201,
            mediaTypes: ['application/xml'],
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });
    });

    describe('given enforced example key', () => {
      test('should return application/json, 200 response', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            exampleKey: 'bear',
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });

      test('and mediaType should return 200 response', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            exampleKey: 'second',
            mediaTypes: ['application/xml'],
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });
    });

    describe('given enforced status code', () => {
      test('should return the first matching example of application/json', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            code: 201,
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });

      test('given that status code is not defined should throw an error', async () => {
        const rejection = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            code: 205,
          },
        })(logger)();

        assertLeft(rejection, e => expect(e).toHaveProperty('message', 'The server cannot find the requested content'));
      });

      test('and example key should return application/json example', async () => {
        const response = await mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            dynamic: false,
            code: 201,
            exampleKey: 'second',
          },
        })(logger)();

        assertRight(response, result => expect(result).toMatchSnapshot());
      });

      describe('HttpOperation contains example', () => {
        test('return lowest 2xx code and match response example to media type accepted by request', async () => {
          const response = await mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: { dynamic: false },
          })(logger)();

          assertRight(response, result => {
            expect(result.statusCode).toBe(200);
            expect(result.body).toMatchObject({
              completed: true,
              id: 1,
              name: 'make prism',
            });
          });
        });

        test('return lowest 2xx response and the first example matching the media type', async () => {
          const response = await mock({
            config: { dynamic: false },
            resource: httpOperations[1],
            input: Object.assign({}, httpRequests[0], {
              data: Object.assign({}, httpRequests[0].data, {
                headers: { accept: 'application/xml' },
              }),
            }),
          })(logger)();

          assertRight(response, result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers).toHaveProperty('x-todos-publish');
          });
        });

        describe('the media type requested does not match the example', () => {
          test('returns an error', async () => {
            const mockResult = await mock({
              config: { dynamic: false },
              resource: httpOperations[0],
              input: Object.assign({}, httpRequests[0], {
                data: Object.assign({}, httpRequests[0].data, {
                  headers: { accept: 'application/yaml' },
                }),
              }),
            })(logger)();

            assertLeft(mockResult, result => expect(result).toHaveProperty('status', 406));
          });
        });
      });

      describe('HTTPOperation contain no examples', () => {
        test('return dynamic response', async () => {
          if (!httpOperations[1].responses[0].contents![0].schema) {
            throw new Error('Missing test');
          }

          const ajv = new Ajv();
          const validate = ajv.compile(httpOperations[1].responses[0].contents![0].schema);

          const response = await mock({
            resource: httpOperations[1],
            input: httpRequests[0],
            config: { dynamic: true },
          })(logger)();

          assertRight(response, result => {
            expect(result).toHaveProperty('statusCode', 200);
            expect(result).toHaveProperty('headers', {
              'Content-type': 'application/json',
              'x-todos-publish': expect.any(String),
            });

            expect(validate(result.body)).toBeTruthy();
          });
        });
      });
    });

    describe('request is invalid', () => {
      test('returns 422 and static error response', async () => {
        const response = await mock({
          config: { dynamic: false },
          resource: httpOperations[0],
          input: httpRequests[1],
        })(logger)();

        assertRight(response, result => {
          expect(result.statusCode).toBe(422);
          expect(result.body).toMatchObject({ message: 'error' });
        });
      });
    });

    test('returns 422 and dynamic error response', async () => {
      if (!httpOperations[1].responses[1].contents![0].schema) {
        throw new Error('Missing test');
      }

      const response = await mock({
        config: { dynamic: false },
        resource: httpOperations[1],
        input: httpRequests[1],
      })(logger)();

      const ajv = new Ajv();
      const validate = ajv.compile(httpOperations[1].responses[1].contents![0].schema);

      assertRight(response, result => {
        expect(validate(result.body)).toBeTruthy();
      });
    });
  });

  describe('for operation that is deprecated', () => {
    it('should set "Deprecation" header', async () => {
      const response = await mock({
        config: { dynamic: false },
        resource: httpOperationsByRef.deprecated,
        input: httpRequests[2],
      })(logger)();

      assertRight(response, result => {
        expect(result.headers).toHaveProperty('deprecation', 'true');
        expect(result.statusCode).toEqual(200);
      });
    });
  });
});
