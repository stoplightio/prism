import { createLogger, IPrismInput } from '@stoplight/prism-core';
import { IHttpOperation, INodeExample, DiagnosticSeverity } from '@stoplight/types';
import { right } from 'fp-ts/ReaderEither';
import * as E from 'fp-ts/Either';
import { flatMap } from 'lodash';
import mock from '../../mocker';
import * as JSONSchemaGenerator from '../../mocker/generator/JSONSchema';
import { IHttpRequest, JSONSchema } from '../../types';
import helpers from '../negotiator/NegotiatorHelpers';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import { runCallback } from '../callback/callbacks';

jest.mock('../callback/callbacks', () => ({
  runCallback: jest.fn(() => () => () => undefined),
}));

const logger = createLogger('TEST', { enabled: false });

describe('mocker', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('mock()', () => {
    const mockSchema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        surname: { type: 'string', format: 'email' },
      },
      required: ['name', 'surname'],
      additionalProperties: false,
    };

    const mockResource: IHttpOperation = {
      id: 'id',
      method: 'get',
      path: '/test',
      request: {},
      responses: [
        {
          id: '200',
          code: '200',
          headers: [],
          contents: [
            {
              id: 'contents',
              mediaType: 'application/json',
              schema: mockSchema,
              examples: [
                {
                  id: 'example-1',
                  key: 'preferred key',
                  value: 'hello',
                },
                {
                  id: 'example-2',
                  key: 'test key',
                  value: 'test value',
                },
                {
                  id: 'example-3',
                  key: 'test key2',
                  externalValue: 'http://example.org/examples/example1',
                },
              ],
              encodings: [],
            },
          ],
        },
        {
          id: '201',
          code: '201',
          headers: [],
          contents: [
            {
              id: 'contents',
              mediaType: 'application/json',
              schema: {
                $ref: '#/responses/0/contents/0/schema',
              },
            },
          ],
        },
        {
          id: '422',
          code: '422',
          headers: [],
          contents: [
            {
              id: 'contents',
              mediaType: 'application/json',
              examples: [
                {
                  id: 'example-1',
                  key: 'invalid_1',
                  value: 'invalid input 1',
                },
                {
                  id: 'example-2',
                  key: 'invalid_2',
                  value: 'invalid input 2',
                },
              ],
              encodings: [],
            },
          ],
        },
      ],
    };

    const mockInput: IPrismInput<IHttpRequest> = {
      validations: [],
      data: {
        method: 'get' as const,
        url: {
          path: '/test',
          baseUrl: 'example.com',
        },
      },
    };

    describe('with valid negotiator response', () => {
      it('returns an empty body when negotiator did not resolve to either example nor schema', () => {
        jest
          .spyOn(helpers, 'negotiateOptionsForValidRequest')
          .mockReturnValue(right({ code: '202', mediaType: 'test', headers: [] }));

        const mockResult = mock({
          config: { dynamic: false },
          resource: mockResource,
          input: mockInput,
        })(logger);

        assertRight(mockResult, result => expect(result).toHaveProperty('body', undefined));
      });

      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          right({
            code: '202',
            mediaType: 'test',
            bodyExample: mockResource.responses[0].contents![0].examples![0],
            headers: [],
          })
        );

        const mockResult = mock({
          config: { dynamic: false },
          resource: mockResource,
          input: mockInput,
        })(logger);

        assertRight(mockResult, result => expect(result).toMatchSnapshot());
      });

      it('returns dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          right({
            code: '202',
            mediaType: 'test',
            schema: mockResource.responses[0].contents![0].schema,
            headers: [],
          })
        );

        const response = mock({
          config: { dynamic: true },
          resource: mockResource,
          input: mockInput,
        })(logger);

        assertRight(response, result => {
          return expect(result).toHaveProperty('body', {
            name: expect.any(String),
            surname: expect.any(String),
          });
        });
      });

      it('runs defined callbacks', () => {
        const callbacksMockResource: IHttpOperation = {
          ...mockResource,
          callbacks: [
            {
              callbackName: 'c1',
              method: 'get',
              path: 'http://example.com/notify',
              id: '1',
              responses: [{ id: '200', code: '200', contents: [{ id: 'contents', mediaType: 'application/json' }] }],
            },
            {
              callbackName: 'c2',
              method: 'get',
              path: 'http://example.com/notify2',
              id: '2',
              responses: [{ id: '200', code: '200', contents: [{ id: 'contents', mediaType: 'application/json' }] }],
            },
          ],
        };
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          right({
            code: '202',
            mediaType: 'test',
            schema: callbacksMockResource.responses[0].contents![0].schema,
            headers: [],
          })
        );

        const response = mock({
          config: { dynamic: true },
          resource: callbacksMockResource,
          input: mockInput,
        })(logger);

        assertRight(response, () => {
          expect(runCallback).toHaveBeenCalledTimes(2);
          expect(runCallback).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ callback: expect.objectContaining({ callbackName: 'c1' }) })
          );
          expect(runCallback).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ callback: expect.objectContaining({ callbackName: 'c2' }) })
          );
        });
      });

      describe('body is url encoded', () => {
        it('runs callback with deserialized body', () => {
          const callbacksMockResource: IHttpOperation = {
            ...mockResource,
            request: {
              body: {
                id: 'body',
                contents: [
                  {
                    id: 'application/x-www-form-urlencoded',
                    mediaType: 'application/x-www-form-urlencoded',
                    schema: {
                      type: 'object',
                      properties: {
                        param1: { type: 'string' },
                        param2: { type: 'string' },
                      },
                    },
                  },
                ],
              },
            },
            callbacks: [
              {
                callbackName: 'callback',
                method: 'get',
                path: 'http://example.com/notify',
                id: '1',
                responses: [
                  { id: '200', code: '200', contents: [{ id: 'application/json', mediaType: 'application/json' }] },
                ],
              },
            ],
          };

          jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
            right({
              code: '202',
              mediaType: 'test',
              schema: callbacksMockResource.responses[0].contents![0].schema,
              headers: [],
            })
          );

          const response = mock({
            config: { dynamic: true },
            resource: callbacksMockResource,
            input: {
              ...mockInput,
              data: {
                ...mockInput.data,
                body: 'param1=test1&param2=test2',
                headers: {
                  ...mockInput.data.headers,
                  'content-type': 'application/x-www-form-urlencoded',
                },
              },
            },
          })(logger);

          assertRight(response, () => {
            expect(runCallback).toHaveBeenCalledWith(
              expect.objectContaining({
                request: expect.objectContaining({
                  body: {
                    param1: 'test1',
                    param2: 'test2',
                  },
                }),
              })
            );
          });
        });
      });
    });

    describe('with a negotiator response containing validation results of Warning severity', () => {
      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest');
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest');

        mock({
          config: { dynamic: false },
          resource: mockResource,
          input: Object.assign({}, mockInput, { validations: [{ severity: DiagnosticSeverity.Warning }] }),
        })(logger);

        expect(helpers.negotiateOptionsForValidRequest).toHaveBeenCalled();
        expect(helpers.negotiateOptionsForInvalidRequest).not.toHaveBeenCalled();
      });
    });

    describe('with a negotiator response containing validation results of Error severity', () => {
      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest');
        jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest');

        mock({
          config: { dynamic: false },
          resource: mockResource,
          input: Object.assign({}, mockInput, { validations: [{ severity: DiagnosticSeverity.Error }] }),
        })(logger);

        expect(helpers.negotiateOptionsForValidRequest).not.toHaveBeenCalled();
        expect(helpers.negotiateOptionsForInvalidRequest).toHaveBeenCalled();
      });

      describe('with examples are defined and exampleKey is defined', () => {
        const response = mock({
          input: Object.assign({}, mockInput, { validations: [{ severity: DiagnosticSeverity.Error }] }),
          resource: mockResource,
          config: { dynamic: false, exampleKey: 'invalid_2', code: 400 },
        })(logger);

        it('should return the selected example', () => {
          const selectedExample = flatMap(mockResource.responses, res =>
            flatMap(res.contents, content => content.examples || [])
          ).find(ex => ex.key === 'invalid_2');

          expect(selectedExample).toBeDefined();
          assertRight(response, result => {
            expect(result.body).toEqual((selectedExample as INodeExample).value);
          });
        });
      });

      describe('with examples are defined and incorrect exampleKey', () => {
        const response = mock({
          input: Object.assign({}, mockInput, { validations: [{ severity: DiagnosticSeverity.Error }] }),
          resource: mockResource,
          config: { dynamic: false, exampleKey: 'missingKey', code: 400 },
        })(logger);

        it('should return 404 error', () => {
          const selectedExample = flatMap(mockResource.responses, res =>
            flatMap(res.contents, content => content.examples || [])
          ).find(ex => ex.key === 'invalid_2');

          expect(selectedExample).toBeDefined();
          assertLeft(response, result => {
            expect(result).toMatchObject({
              detail: 'Response for contentType: application/json and exampleKey: missingKey does not exist.',
              name: 'https://stoplight.io/prism/errors#NOT_FOUND',
              status: 404,
            });
          });
        });
      });
    });

    describe('when example is of type INodeExternalExample', () => {
      it('generates a dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          right({
            code: '202',
            mediaType: 'test',
            bodyExample: mockResource.responses[0].contents![0].examples![1],
            headers: [],
            schema: { type: 'string' },
          })
        );

        jest.spyOn(JSONSchemaGenerator, 'generate').mockReturnValue(E.right('example value chelsea'));

        const mockResult = mock({
          config: { dynamic: true },
          resource: mockResource,
          input: mockInput,
        })(logger);

        assertRight(mockResult, result => expect(result).toMatchSnapshot());
      });
    });

    describe('when an example is defined', () => {
      describe('and dynamic flag is true', () => {
        describe('should generate a dynamic response', () => {
          const generatedExample = { hello: 'world' };

          beforeAll(() => {
            jest.spyOn(JSONSchemaGenerator, 'generate').mockReturnValue(E.right(generatedExample));
            jest.spyOn(JSONSchemaGenerator, 'generateStatic');
          });

          afterAll(() => {
            jest.restoreAllMocks();
          });

          it('the dynamic response should not be an example one', () => {
            const response = mock({
              input: mockInput,
              resource: mockResource,
              config: { dynamic: true },
            })(logger);

            expect(JSONSchemaGenerator.generate).toHaveBeenCalled();
            expect(JSONSchemaGenerator.generateStatic).not.toHaveBeenCalled();

            const allExamples = flatMap(mockResource.responses, res =>
              flatMap(res.contents, content => content.examples || [])
            ).map(x => {
              if ('value' in x) return x.value;
            });

            assertRight(response, result => {
              expect(result.body).toBeDefined();

              allExamples.forEach(example => expect(result.body).not.toEqual(example));
              expect(result.body).toHaveProperty('hello', 'world');
            });
          });
        });
      });

      describe('and dynamic flag is false', () => {
        describe('and the response has an example', () => {
          describe('and the example has been explicited', () => {
            const response = mock({
              input: mockInput,
              resource: mockResource,
              config: { dynamic: true, exampleKey: 'test key' },
            })(logger);

            it('should return the selected example', () => {
              const selectedExample = flatMap(mockResource.responses, res =>
                flatMap(res.contents, content => content.examples || [])
              ).find(ex => ex.key === 'test key');

              expect(selectedExample).toBeDefined();

              assertRight(response, result => expect(result.body).toEqual((selectedExample as INodeExample).value));
            });
          });

          describe('no response example is requested', () => {
            const response = mock({
              input: mockInput,
              resource: mockResource,
              config: { dynamic: false },
            })(logger);

            it('returns the first example', () => {
              assertRight(response, result => {
                expect(result.body).toBeDefined();
                const selectedExample = mockResource.responses[0].contents![0].examples![0];

                expect(selectedExample).toBeDefined();
                expect(result.body).toEqual((selectedExample as INodeExample).value);
              });
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
                  id: '200',
                  code: '200',
                  headers: [],
                  contents: [
                    {
                      id: 'application/json',
                      mediaType: 'application/json',
                      schema,
                    },
                  ],
                },
              ],
            };
          }

          function mockResponseWithSchema(schema: JSONSchema) {
            return mock({
              input: mockInput,
              resource: createOperationWithSchema(schema),
              config: { dynamic: false },
            })(logger);
          }

          describe('and the property has an example key', () => {
            const eitherResponse = mockResponseWithSchema({
              type: 'object',
              properties: {
                name: { type: 'string', examples: ['Clark'] },
              },
            });

            it('should return the example key', () =>
              assertRight(eitherResponse, response => expect(response.body).toHaveProperty('name', 'Clark')));

            describe('and also a default key', () => {
              const eitherResponseWithDefault = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: ['J'], default: 'JJ' },
                },
              });

              it('prefers the default', () =>
                assertRight(eitherResponseWithDefault, responseWithDefault =>
                  expect(responseWithDefault.body).toHaveProperty('middlename', 'JJ')
                ));
            });

            describe('with multiple example values in the array', () => {
              const eitherResponseWithMultipleExamples = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: ['WW', 'JJ'] },
                },
              });

              it('prefers the first example', () =>
                assertRight(eitherResponseWithMultipleExamples, responseWithMultipleExamples =>
                  expect(responseWithMultipleExamples.body).toHaveProperty('middlename', 'WW')
                ));
            });

            describe('with an empty `examples` array', () => {
              const eitherResponseWithNoExamples = mockResponseWithSchema({
                type: 'object',
                properties: {
                  middlename: { type: 'string', examples: [] },
                },
              });

              it('fallbacks to string', () =>
                assertRight(eitherResponseWithNoExamples, responseWithNoExamples =>
                  expect(responseWithNoExamples.body).toHaveProperty('middlename', 'string')
                ));
            });
          });

          describe('and the property containing the example is deeply nested', () => {
            const eitherResponseWithNestedObject = mockResponseWithSchema({
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

            assertRight(eitherResponseWithNestedObject, responseWithNestedObject => {
              it('should return the example key', () =>
                expect(responseWithNestedObject.body).toHaveProperty('pet.name', 'Clark'));
              it('should still prefer the default', () =>
                expect(responseWithNestedObject.body).toHaveProperty('pet.middlename', 'JJ'));
            });
          });

          describe('and the property has not an example, but a default key', () => {
            const eitherResponse = mockResponseWithSchema({
              type: 'object',
              properties: {
                surname: { type: 'string', default: 'Kent' },
              },
            });

            it('should use such key', () => {
              assertRight(eitherResponse, response => expect(response.body).toHaveProperty('surname', 'Kent'));
            });
          });

          describe('and the property has nor default, nor example', () => {
            describe('is nullable', () => {
              const eitherResponse = mockResponseWithSchema({
                type: 'object',
                properties: {
                  age: { type: ['number', 'null'] },
                },
              });

              it('should be set to number', () =>
                assertRight(eitherResponse, response => expect(response.body).toHaveProperty('age', 0)));
            });

            describe('and is not nullable', () => {
              const eitherResponse = mockResponseWithSchema({
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

              assertRight(eitherResponse, response => {
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

    describe('when response schema has an inline $ref', () => {
      it('returns static example', () => {
        const mockResult = mock({
          config: { dynamic: false, code: 201 },
          resource: mockResource,
          input: mockInput,
        })(logger);

        assertRight(mockResult, result => {
          expect(result.body).toHaveProperty('name');
          expect(result.body).toHaveProperty('surname');
        });
      });
    });
  });
});
