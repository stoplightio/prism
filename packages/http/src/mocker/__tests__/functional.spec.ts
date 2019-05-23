import { ISchema } from '@stoplight/types';
import * as Ajv from 'ajv';

import { httpOperations, httpRequests } from '../../__tests__/fixtures';
import { JSONSchemaExampleGenerator } from '../generator/JSONSchemaExampleGenerator';
import { HttpMocker } from '../index';

describe('http mocker', () => {
  const mocker = new HttpMocker(new JSONSchemaExampleGenerator());

  describe('request is valid', () => {
    describe('given only enforced content type', () => {
      test('and that content type exists should first 200 static example', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              mediaType: 'text/plain',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });

      test('and that content type does not exist should return empty body', () => {
        return expect(
          mocker.mock({
            resource: httpOperations[0],
            input: httpRequests[0],
            config: {
              mock: {
                dynamic: false,
                mediaType: 'text/funky',
              },
            },
          }),
        ).resolves.toMatchObject({ headers: { 'Content-type': 'text/plain' }, body: undefined });
      });
    });

    describe('given enforced status code and contentType and exampleKey', () => {
      test('should return the matching example', async () => {
        const response = await mocker.mock({
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
        });

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced status code and contentType', () => {
      test('should return the first matching example', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              code: '201',
              mediaType: 'application/xml',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced example key', () => {
      test('should return application/json, 200 response', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              exampleKey: 'bear',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });

      test('and mediaType should return 200 response', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              exampleKey: 'second',
              mediaType: 'application/xml',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });
    });

    describe('given enforced status code', () => {
      test('should return the first matching example of application/json', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              code: '201',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });

      test('given that status code is not defined should throw an error', () => {
        const rejection = mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              code: '205',
            },
          },
        });

        return expect(rejection).rejects.toEqual(new Error('Requested status code is not defined in the schema.'));
      });

      test('and example key should return application/json example', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: false,
              code: '201',
              exampleKey: 'second',
            },
          },
        });

        expect(response).toMatchSnapshot();
      });
    });

    describe('HttpOperation contains example', () => {
      test('return lowest 2xx code and match response example to media type accepted by request', async () => {
        const response = await mocker.mock({
          resource: httpOperations[0],
          input: httpRequests[0],
        });

        expect(response).toMatchSnapshot();
      });

      test('return lowest 2xx response and the first example matching the media type', async () => {
        const response = await mocker.mock({
          resource: httpOperations[1],
          input: Object.assign({}, httpRequests[0], {
            data: Object.assign({}, httpRequests[0].data, {
              headers: { 'Content-type': 'application/xml' },
            }),
          }),
        });

        expect(response).toMatchSnapshot({
          headers: {
            'x-todos-publish': expect.any(String),
          },
        });
      });

      describe('the media type requested does not match the example', () => {
        test('throw exception', () => {
          return expect(
            mocker.mock({
              resource: httpOperations[0],
              input: Object.assign({}, httpRequests[0], {
                data: Object.assign({}, httpRequests[0].data, {
                  headers: { 'Content-type': 'application/yaml' },
                }),
              }),
            }),
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

        const response = await mocker.mock({
          resource: httpOperations[1],
          input: httpRequests[0],
          config: {
            mock: {
              dynamic: true,
            },
          },
        });

        expect(response).toHaveProperty('statusCode', 200);
        expect(response).toHaveProperty('headers', {
          'Content-type': 'application/json',
          'x-todos-publish': expect.any(String),
        });
        expect(validate(JSON.parse(response.body))).toBe(true);
      });
    });
  });

  describe('request is invalid', () => {
    test('returns 422 and static error response', async () => {
      const response = await mocker.mock({
        resource: httpOperations[0],
        input: httpRequests[1],
      });

      expect(response).toMatchSnapshot();
    });

    test('returns 422 and dynamic error response', async () => {
      if (!httpOperations[1].responses[1].contents[0].schema) {
        throw new Error('Missing test');
      }

      const response = await mocker.mock({
        resource: httpOperations[1],
        input: httpRequests[1],
      });

      const ajv = new Ajv();
      const validate = ajv.compile(httpOperations[1].responses[1].contents[0].schema as ISchema);

      expect(validate(JSON.parse(response.body))).toBe(true);
    });
  });
});
