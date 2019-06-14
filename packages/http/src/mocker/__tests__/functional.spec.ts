import * as Ajv from 'ajv';

import { createLogger } from '@stoplight/prism-core';
import { Either } from 'fp-ts/lib/Either';
import { httpOperations, httpRequests } from '../../__tests__/fixtures';
import { HttpMocker } from '../index';

const logger = createLogger('TEST', { enabled: false });

function assertRight<L, A>(e: Either<L, A>, onRight: (a: A) => void) {
  e.fold(l => {
    throw new Error('Right expected, got a Left: ' + l);
  }, onRight);
}

function assertLeft<L, A>(e: Either<L, A>, onLeft: (a: L) => void) {
  e.fold(onLeft, a => {
    throw new Error('Left expected, got a Right: ' + a);
  });
}

describe('http mocker', () => {
  const mocker = new HttpMocker();

  describe('request is valid', () => {
    describe('given only enforced content type', () => {
      test('and that content type exists should first 200 static example', () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                mediaTypes: ['text/plain'],
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });

      test('and that content type does not exist should return empty body', () => {
        const mockResult = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                mediaTypes: ['text/funky'],
              },
            },
          })
          .run(logger);

        assertRight(mockResult, result =>
          expect(result).resolves.toMatchObject({ headers: { 'Content-type': 'text/plain' }, body: undefined }),
        );
      });
    });

    describe('given enforced status code and contentType and exampleKey', () => {
      test('should return the matching example', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
                exampleKey: 'second',
                mediaTypes: ['application/xml'],
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });
    });

    describe('given enforced status code and contentType', () => {
      test('should return the first matching example', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
                mediaTypes: ['application/xml'],
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });
    });

    describe('given enforced example key', () => {
      test('should return application/json, 200 response', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                exampleKey: 'bear',
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });

      test('and mediaType should return 200 response', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                exampleKey: 'second',
                mediaTypes: ['application/xml'],
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });
    });

    describe('given enforced status code', () => {
      test('should return the first matching example of application/json', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });

      test('given that status code is not defined should throw an error', () => {
        const rejection = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '205',
              },
            },
          })
          .run(logger);

        assertLeft(rejection, e =>
          expect(e).toHaveProperty('message', 'Requested status code is not defined in the schema.'),
        );
      });

      test('and example key should return application/json example', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
                exampleKey: 'second',
              },
            },
          })
          .run(logger);

        assertRight(response, result => expect(result).resolves.toMatchSnapshot());
      });

      describe('HttpOperation contains example', () => {
        test('return lowest 2xx code and match response example to media type accepted by request', async () => {
          const response = mocker
            .mock({
              resource: httpOperations[0],
              input: httpRequests[0],
            })
            .run(logger);

          assertRight(response, result => {
            expect(result.statusCode).toBe(200);
            expect(result.body).toMatchObject({
              completed: true,
              id: 1,
              name: 'make prism',
            });
          });
        });

        test('return lowest 2xx response and the first example matching the media type', () => {
          const response = mocker
            .mock({
              resource: httpOperations[1],
              input: Object.assign({}, httpRequests[0], {
                data: Object.assign({}, httpRequests[0].data, {
                  headers: { accept: 'application/xml' },
                }),
              }),
            })
            .run(logger);

          assertRight(response, result => {
            expect(result.statusCode).toBe(200);
            expect(result.headers).toHaveProperty('x-todos-publish');
          });
        });

        describe('the media type requested does not match the example', () => {
          test('returns an error', () => {
            const mockResult = mocker
              .mock({
                resource: httpOperations[0],
                input: Object.assign({}, httpRequests[0], {
                  data: Object.assign({}, httpRequests[0].data, {
                    headers: { accept: 'application/yaml' },
                  }),
                }),
              })
              .run(logger);

            assertRight(mockResult, result =>
              expect(result).toMatchObject({
                headers: { 'Content-type': 'text/plain' },
                body: undefined,
              }),
            );
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

          const response = mocker
            .mock({
              resource: httpOperations[1],
              input: httpRequests[0],
              config: {
                mock: {
                  dynamic: true,
                },
              },
            })
            .run(logger);

          assertRight(response, async result => {
            const r = await result;
            expect(r).toHaveProperty('statusCode', 200);
            expect(r).toHaveProperty('headers', {
              'Content-type': 'application/json',
              'x-todos-publish': expect.any(String),
            });

            expect(validate(r.body)).toBeTruthy();
          });
        });
      });
    });

    describe('request is invalid', () => {
      test('returns 422 and static error response', async () => {
        const response = mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[1],
          })
          .run(logger);

        assertRight(response, result => {
          expect(result.statusCode).toBe(422);
          expect(result.body).toMatchObject({ message: 'error' });
        });
      });
    });

    test('returns 422 and dynamic error response', () => {
      if (!httpOperations[1].responses[1].contents![0].schema) {
        throw new Error('Missing test');
      }

      const response = mocker
        .mock({
          resource: httpOperations[1],
          input: httpRequests[1],
        })
        .run(logger);

      const ajv = new Ajv();
      const validate = ajv.compile(httpOperations[1].responses[1].contents![0].schema!);

      assertRight(response, result => {
        expect(validate(result.body)).toBeTruthy();
      });
    });
  });
});
