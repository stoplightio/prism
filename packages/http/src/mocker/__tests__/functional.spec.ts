import { ISchema } from '@stoplight/types';
import * as Ajv from 'ajv';

import { createLogger } from '@stoplight/prism-core';
import { httpOperations, httpRequests } from '../../__tests__/fixtures';
import { generate } from '../generator/JSONSchema';
import { HttpMocker } from '../index';

const logger = createLogger('TEST', { enabled: false });

describe('http mocker', () => {
  const mocker = new HttpMocker(generate);

  describe('request is valid', () => {
    describe('given only enforced content type', () => {
      test('and that content type exists should first 200 static example', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                mediaType: 'text/plain',
              },
            },
          })
          .run(logger);

        expect(response).toMatchSnapshot();
      });

      test('and that content type does not exist should return empty body', () => {
        return expect(
          mocker
            .mock({
              resource: httpOperations[0],
              input: httpRequests[0],
              config: {
                mock: {
                  dynamic: false,
                  mediaType: 'text/funky',
                },
              },
            })
            .run(logger),
        ).resolves.toMatchObject({ headers: { 'Content-type': 'text/plain' }, body: undefined });
      });
    });

    describe('given enforced status code and contentType and exampleKey', () => {
      test('should return the matching example', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
                exampleKey: 'second',
                mediaType: 'application/xml',
              },
            },
          })
          .run(logger);

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced status code and contentType', () => {
      test('should return the first matching example', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                code: '201',
                mediaType: 'application/xml',
              },
            },
          })
          .run(logger);

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced example key', () => {
      test('should return application/json, 200 response', async () => {
        const response = await mocker
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

        expect(response).toMatchSnapshot();
      });

      test('and mediaType should return 200 response', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                exampleKey: 'second',
                mediaType: 'application/xml',
              },
            },
          })
          .run(logger);

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced status code', () => {
      test('should return the first matching example of application/json', async () => {
        const response = await mocker
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

        expect(response).toMatchSnapshot();
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

        return expect(rejection).rejects.toEqual(new Error('Requested status code is not defined in the schema.'));
      });

      test('and example key should return application/json example', async () => {
        const response = await mocker
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

        expect(response).toMatchSnapshot();
      });
    });

    describe('HttpOperation contains example', () => {
      test('return lowest 2xx code and match response example to media type accepted by request', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[0],
            input: httpRequests[0],
          })
          .run(logger);

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          completed: true,
          id: 1,
          name: 'make prism',
        });
      });

      test('return lowest 2xx response and the first example matching the media type', async () => {
        const response = await mocker
          .mock({
            resource: httpOperations[1],
            input: Object.assign({}, httpRequests[0], {
              data: Object.assign({}, httpRequests[0].data, {
                headers: { 'Content-type': 'application/xml' },
              }),
            }),
          })
          .run(logger);

        expect(response).toMatchSnapshot({
          headers: {
            'x-todos-publish': expect.any(String),
          },
        });
      });

      describe('the media type requested does not match the example', () => {
        test('throw exception', () => {
          return expect(
            mocker
              .mock({
                resource: httpOperations[0],
                input: Object.assign({}, httpRequests[0], {
                  data: Object.assign({}, httpRequests[0].data, {
                    headers: { 'Content-type': 'application/yaml' },
                  }),
                }),
              })
              .run(logger),
          ).resolves.toMatchObject({
            headers: { 'Content-type': 'text/plain' },
            body: undefined,
          });
        });
      });
    });

    describe('HTTPOperation contain no examples', () => {
      test('return dynamic response', async () => {
        if (!httpOperations[1].responses[0].contents[0].schema) {
          throw new Error('Missing test');
        }

        const ajv = new Ajv();
        const validate = ajv.compile(httpOperations[1].responses[0].contents[0].schema as ISchema);

        const response = await mocker
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

        expect(response).toHaveProperty('statusCode', 200);
        expect(response).toHaveProperty('headers', {
          'Content-type': 'application/json',
          'x-todos-publish': expect.any(String),
        });
        expect(validate(response.body)).toBeTruthy();
      });
    });
  });

  describe('request is invalid', () => {
    test('returns 422 and static error response', async () => {
      const response = await mocker
        .mock({
          resource: httpOperations[0],
          input: httpRequests[1],
        })
        .run(logger);

      expect(response.statusCode).toBe(422);
      expect(response.body).toMatchObject({ message: 'error' });
    });

    test('returns 422 and dynamic error response', async () => {
      if (!httpOperations[1].responses[1].contents[0].schema) {
        throw new Error('Missing test');
      }

      const response = await mocker
        .mock({
          resource: httpOperations[1],
          input: httpRequests[1],
        })
        .run(logger);

      const ajv = new Ajv();
      const validate = ajv.compile(httpOperations[1].responses[1].contents[0].schema!);

      expect(validate(response.body)).toBeTruthy();
    });
  });
});
