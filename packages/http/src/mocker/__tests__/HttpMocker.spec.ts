import { JSONSchema } from '@stoplight/prism-http/src/types';
import { IHttpOperation, INodeExample } from '@stoplight/types';
import { flatMap } from 'lodash';
import { HttpMocker } from '../../mocker';
import * as JSONSchemaGenerator from '../../mocker/generator/JSONSchema';
import helpers from '../negotiator/NegotiatorHelpers';

describe('HttpMocker', () => {
  const httpMocker = new HttpMocker();

  afterEach(() => jest.restoreAllMocks());

  describe('mock()', () => {
    const mockSchema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        surname: { type: 'string', format: 'email' },
      },
      required: ['name', 'email'],
    };

    const mockResource: IHttpOperation = {
      id: 'id',
      method: 'get',
      path: '/test',
      request: {},
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
                  key: 'preferred key',
                  value: 'hello',
                },
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
        method: 'get' as const,
        url: {
          path: '/test',
          baseUrl: 'example.com',
        },
      },
    };

    it('fails when called with no resource', () => {
      return expect(() =>
        httpMocker.mock({
          input: mockInput,
        }),
      ).toThrowErrorMatchingSnapshot();
    });

    it('fails when called with no input', () => {
      return expect(() =>
        httpMocker.mock({
          resource: mockResource,
        }),
      ).toThrowErrorMatchingSnapshot();
    });

    describe('with valid negotiator response', () => {
      it('returns an empty body when negotiator did not resolve to either example nor schema', () => {
        jest
          .spyOn(helpers, 'negotiateOptionsForValidRequest')
          .mockReturnValue({ code: '202', mediaType: 'test', headers: [] });

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          }),
        ).toHaveProperty('body', undefined);
      });

      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue({
          code: '202',
          mediaType: 'test',
          bodyExample: mockResource.responses![0].contents![0].examples![0],
          headers: [],
        });

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          }),
        ).toMatchSnapshot();
      });

      it('returns dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue({
          code: '202',
          mediaType: 'test',
          schema: mockResource.responses![0].contents![0].schema,
          headers: [],
        });

        const response = httpMocker.mock({
          resource: mockResource,
          input: mockInput,
        });

        return expect(response.body).toMatchObject({
          name: expect.any(String),
          surname: expect.any(String),
        });
      });
    });

    describe('with invalid negotiator response', () => {
      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest').mockReturnValue({
          code: '202',
          mediaType: 'test',
          bodyExample: mockResource.responses![0].contents![0].examples![0],
          headers: [],
        });

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: Object.assign({}, mockInput, { validations: { input: [{}] } }),
          }),
        ).toMatchSnapshot();
      });
    });

    describe('when example is of type INodeExternalExample', () => {
      it('generates a dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue({
          code: '202',
          mediaType: 'test',
          bodyExample: mockResource.responses![0].contents![0].examples![1],
          headers: [],
          schema: { type: 'string' },
        });

        jest.spyOn(JSONSchemaGenerator, 'generate').mockReturnValue('example value chelsea');

        return expect(
          httpMocker.mock({
            resource: mockResource,
            input: mockInput,
          }),
        ).toMatchSnapshot();
      });
    });

    describe('when an example is defined', () => {
      describe('and dynamic flag is true', () => {
        describe('should generate a dynamic response', () => {
          const generatedExample = { hello: 'world' };

          beforeAll(() => {
            jest.spyOn(JSONSchemaGenerator, 'generate').mockReturnValue(generatedExample);
            jest.spyOn(JSONSchemaGenerator, 'generateStatic');
          });

          afterAll(() => {
            jest.restoreAllMocks();
          });

          it('the dynamic response should not be an example one', () => {
            const response = httpMocker.mock({
              input: mockInput,
              resource: mockResource,
              config: { mock: { dynamic: true } },
            });

            expect(JSONSchemaGenerator.generate).toHaveBeenCalled();
            expect(JSONSchemaGenerator.generateStatic).not.toHaveBeenCalled();
            expect(response.body).toBeDefined();

            const allExamples = flatMap(mockResource.responses, res =>
              flatMap(res.contents, content => content.examples || []),
            ).map(x => {
              if ('value' in x) return x.value;
            });

            allExamples.forEach(example => expect(response.body).not.toEqual(example));
            expect(response.body).toHaveProperty('hello', 'world');
          });
        });
      });

      describe('and dynamic flag is false', () => {
        describe('and the response has an example', () => {
          describe('and the example has been explicited', () => {
            const response = httpMocker.mock({
              input: mockInput,
              resource: mockResource,
              config: { mock: { dynamic: false, exampleKey: 'test key' } },
            });

            it('should return the selected example', () => {
              expect(response.body).toBeDefined();

              const selectedExample = flatMap(mockResource.responses, res =>
                flatMap(res.contents, content => content.examples || []),
              ).find(ex => ex.key === 'test key');

              expect(selectedExample).toBeDefined();
              expect(response.body).toEqual((selectedExample as INodeExample).value);
            });
          });

          describe('no response example is requested', () => {
            const response = httpMocker.mock({
              input: mockInput,
              resource: mockResource,
              config: { mock: { dynamic: false } },
            });

            it('returns the first example', () => {
              expect(response.body).toBeDefined();
              const selectedExample = mockResource.responses[0].contents![0].examples![0];

              expect(selectedExample).toBeDefined();
              expect(response.body).toEqual((selectedExample as INodeExample).value);
            });
          });
        });

        describe('and the response has not an examples', () => {
          function createOperationWithSchema(schema: JSONSchema): IHttpOperation {
            return {
              id: 'id',
              method: 'get',
              path: '/test',
              request: {},
              responses: [
                {
                  code: '200',
                  headers: [],
                  contents: [
                    {
                      mediaType: 'application/json',
                      schema,
                    },
                  ],
                },
              ],
            };
          }

          function mockResponseWithSchema(schema: JSONSchema) {
            return httpMocker.mock({
              input: mockInput,
              resource: createOperationWithSchema(schema),
              config: { mock: { dynamic: false } },
            });
          }

          describe('and the property has an example key', () => {
            const response = mockResponseWithSchema({
              type: 'object',
              properties: {
                name: { type: 'string', examples: ['Clark'] },
              },
            });

            it('should return the example key', () => expect(response.body).toHaveProperty('name', 'Clark'));

            describe('and also a default key', () => {
              const responseWithDefault = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: ['J'], default: 'JJ' },
                },
              });

              it('prefers the example', () => expect(responseWithDefault.body).toHaveProperty('middlename', 'J'));
            });

            describe('with multiple example values in the array', () => {
              const responseWithMultipleExamples = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: ['WW', 'JJ'] },
                },
              });

              it('prefers the first example', () =>
                expect(responseWithMultipleExamples.body).toHaveProperty('middlename', 'WW'));
            });

            describe('with an empty `examples` array', () => {
              const responseWithNoExamples = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: [] },
                },
              });

              it('fallbacks to string', () =>
                expect(responseWithNoExamples.body).toHaveProperty('middlename', 'string'));
            });
          });

          describe('and the property containing the example is deeply nested', () => {
            const responseWithNestedObject = mockResponseWithSchema({
              type: 'object',
              properties: {
                pet: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', examples: ['Clark'] },
                    middlename: { type: 'string', examples: ['J'], default: 'JJ' },
                  },
                },
              },
            });

            it('should return the example key', () =>
              expect(responseWithNestedObject.body).toHaveProperty('pet.name', 'Clark'));
            it('should still prefer the example', () =>
              expect(responseWithNestedObject.body).toHaveProperty('pet.middlename', 'J'));
          });

          describe('and the property has not an example, but a default key', () => {
            const response = mockResponseWithSchema({
              type: 'object',
              properties: {
                surname: { type: 'string', default: 'Kent' },
              },
            });

            it('should use such key', () => {
              expect(response.body).toHaveProperty('surname', 'Kent');
            });
          });

          describe('and the property has nor default, nor example', () => {
            describe('is nullable', () => {
              const response = mockResponseWithSchema({
                type: 'object',
                properties: {
                  age: { type: ['number', 'null'] },
                },
              });

              it('should be set to null', () => expect(response.body).toHaveProperty('age', null));
            });

            describe('and is not nullable', () => {
              const response = mockResponseWithSchema({
                type: 'object',
                properties: {
                  name: { type: 'string', examples: ['Clark'] },
                  middlename: { type: 'string', examples: ['J'], default: 'JJ' },
                  surname: { type: 'string', default: 'Kent' },
                  age: { type: ['number', 'null'] },
                  email: { type: 'string' },
                  deposit: { type: 'number' },
                  paymentStatus: { type: 'string', enum: ['completed', 'outstanding'] },
                  creditScore: {
                    anyOf: [{ type: 'number', examples: [1958] }, { type: 'string' }],
                  },
                  paymentScore: {
                    oneOf: [{ type: 'string' }, { type: 'number', examples: [1958] }],
                  },
                  walletScore: {
                    allOf: [{ type: 'string' }, { default: 'hello' }],
                  },
                  pet: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', examples: ['Clark'] },
                      middlename: { type: 'string', examples: ['J'], default: 'JJ' },
                    },
                  },
                },
                required: ['name', 'surname', 'age', 'email'],
              });

              it('should return the default string', () => expect(response.body).toHaveProperty('email', 'string'));
              it('should return the default number', () => expect(response.body).toHaveProperty('deposit', 0));
              it('should return the first enum value', () =>
                expect(response.body).toHaveProperty('paymentStatus', 'completed'));
              it('should return the first anyOf value', () =>
                expect(response.body).toHaveProperty('creditScore', 1958));
              it('should return the first oneOf value', () =>
                expect(response.body).toHaveProperty('paymentScore', 'string'));
              it('should return the first allOf value', () =>
                expect(response.body).toHaveProperty('walletScore', 'hello'));
            });
          });
        });
      });
    });
  });
});
