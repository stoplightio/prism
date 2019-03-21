import { IHttpOperation } from '@stoplight/types';

import { HttpMocker } from '../../mocker';
import { JSONSchemaExampleGenerator } from '../../mocker/generator/JSONSchemaExampleGenerator';
import { IHttpMethod } from '../../types';
import helpers from '../negotiator/NegotiatorHelpers';

describe('HttpMocker', () => {
  let httpMocker: HttpMocker;
  const mockExampleGenerator = new JSONSchemaExampleGenerator();

  beforeEach(() => {
    httpMocker = new HttpMocker(mockExampleGenerator);
    jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockImplementation(jest.fn);
    jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest').mockImplementation(jest.fn);
    jest.spyOn(mockExampleGenerator, 'generate').mockImplementation(jest.fn);
  });

  describe('mock()', () => {
    const mockSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
      required: ['name', 'email'],
    };

    const mockResource: IHttpOperation = {
      id: 'id',
      method: 'get',
      path: '/test',
      servers: [],
      security: [],
      request: {
        headers: [],
        query: [],
        cookie: [],
        path: [],
      },
      responses: [
        {
          code: '200',
          headers: [],
          contents: [
            {
              mediaType: 'application/json',
              schema: mockSchema,
              examples: [
                {
                  key: 'test key',
                  value: 'test value',
                },
                {
                  key: 'test key2',
                  externalValue: 'http://example.org/examples/example1',
                },
              ],
              encodings: [],
            },
          ],
        },
      ],
    };

    const mockInput = {
      validations: {
        input: [],
      },
      data: {
        method: 'get' as IHttpMethod,
        url: {
          path: '/test',
          baseUrl: 'example.com',
        },
      },
    };

    it('fails when called with no resource', () => {
      return expect(
        httpMocker.mock({
          input: mockInput,
        })
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    it('fails when called with no input', () => {
      return expect(
        httpMocker.mock({
          resource: mockResource,
        })
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    describe('with valid negotiator response', () => {
      it('returns an empty body when negotiator did not resolve to either example nor schema', () => {
        jest
          .spyOn(helpers, 'negotiateOptionsForValidRequest')
          .mockImplementation(() => ({ code: '202', mediaType: 'test' }));

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          })
        ).resolves.toHaveProperty('body', undefined);
      });

      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockImplementation(() => ({
          code: '202',
          mediaType: 'test',
          example: mockResource.responses![0].contents![0].examples![0],
        }));

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          })
        ).resolves.toMatchSnapshot();
      });

      it('returns dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockImplementation(() => ({
          code: '202',
          mediaType: 'test',
          schema: mockResource.responses![0].contents![0].schema,
        }));

        jest.spyOn(mockExampleGenerator, 'generate').mockImplementation(() => 'example value');

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          })
        ).resolves.toMatchSnapshot();
      });

      it('defaults to empty mock configuration when called with boolean mock value', async () => {
        const spy = jest
          .spyOn(helpers, 'negotiateOptionsForValidRequest')
          .mockImplementation(() => ({
            code: '202',
            mediaType: 'test',
            example: mockResource.responses![0].contents![0].examples![0],
          }));

        await httpMocker.mock({
          resource: mockResource,
          input: mockInput,
          config: { mock: true },
        });

        expect(spy).toHaveBeenCalledWith(mockResource, {});
      });
    });

    describe('with invalid negotiator response', () => {
      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest').mockImplementation(() => ({
          code: '202',
          mediaType: 'test',
          example: mockResource.responses![0].contents![0].examples![0],
        }));

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: Object.assign({}, mockInput, { validations: { input: [{}] } }),
          })
        ).resolves.toMatchSnapshot();
      });
    });

    describe('when example is of type INodeExternalExample', () => {
      it('generates a dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockImplementation(() => ({
          code: '202',
          mediaType: 'test',
          example: mockResource.responses![0].contents![0].examples![1],
          schema: { type: 'string' }
        }));

        jest
          .spyOn(mockExampleGenerator, 'generate')
          .mockImplementation(() => 'example value chelsea');

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          })
        ).resolves.toMatchSnapshot();
      });
    });
  });
});
