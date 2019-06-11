import { createLogger } from '@stoplight/prism-core';
import { IHttpOperation, INodeExample } from '@stoplight/types';
import { Either, right } from 'fp-ts/lib/Either';
import { reader } from 'fp-ts/lib/Reader';
import { JSONSchema } from 'http/src/types';
import { flatMap } from 'lodash';
import { HttpMocker } from '../../mocker';
import * as JSONSchemaGenerator from '../../mocker/generator/JSONSchema';
import helpers from '../negotiator/NegotiatorHelpers';

function assertRight<L, A>(e: Either<L, A>, onRight: (a: A) => void) {
  e.fold(l => {
    throw new Error('Right expected, got a Left: ' + l);
  }, onRight);
}

const logger = createLogger('TEST', { enabled: false });

describe('HttpMocker', () => {
  const httpMocker = new HttpMocker(JSONSchemaGenerator.generate);

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
        httpMocker
          .mock({
            input: mockInput,
          })
          .run(logger),
      ).toThrowErrorMatchingSnapshot();
    });

    it('fails when called with no input', () => {
      return expect(() =>
        httpMocker
          .mock({
            resource: mockResource,
          })
          .run(logger),
      ).toThrowErrorMatchingSnapshot();
    });

    describe('with valid negotiator response', () => {
      it('returns an empty body when negotiator did not resolve to either example nor schema', () => {
        jest
          .spyOn(helpers, 'negotiateOptionsForValidRequest')
          .mockReturnValue(reader.of(right({ code: '202', mediaType: 'test', headers: [] })));

        const mockResult = httpMocker
          .mock({
            resource: mockResource,
            input: mockInput,
          })
          .run(logger);

        assertRight(mockResult, result => expect(result).resolves.toHaveProperty('body', undefined));
      });

      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          reader.of(
            right({
              code: '202',
              mediaType: 'test',
              bodyExample: mockResource.responses![0].contents![0].examples![0],
              headers: [],
            }),
          ),
        );

        const mockResult = httpMocker
          .mock({
            resource: mockResource,
            input: mockInput,
          })
          .run(logger);

        assertRight(mockResult, result => expect(result).resolves.toMatchSnapshot());
      });

      it('returns dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          reader.of(
            right({
              code: '202',
              mediaType: 'test',
              schema: mockResource.responses![0].contents![0].schema,
              headers: [],
            }),
          ),
        );

        const response = httpMocker
          .mock({
            resource: mockResource,
            input: mockInput,
          })
          .run(logger);

        assertRight(response, result => {
          return expect(result).resolves.toHaveProperty('body', {
            name: expect.any(String),
            surname: expect.any(String),
          });
        });
      });
    });

    describe('with invalid negotiator response', () => {
      it('returns static example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForInvalidRequest').mockReturnValue(
          reader.of(
            right({
              code: '202',
              mediaType: 'test',
              bodyExample: mockResource.responses![0].contents![0].examples![0],
              headers: [],
            }),
          ),
        );

        const mockResult = httpMocker
          .mock({
            resource: mockResource,
            input: Object.assign({}, mockInput, { validations: { input: [{}] } }),
          })
          .run(logger);

        assertRight(mockResult, result => expect(result).resolves.toMatchSnapshot());
      });
    });

    describe('when example is of type INodeExternalExample', () => {
      it('generates a dynamic example', () => {
        jest.spyOn(helpers, 'negotiateOptionsForValidRequest').mockReturnValue(
          reader.of(
            right({
              code: '202',
              mediaType: 'test',
              bodyExample: mockResource.responses![0].contents![0].examples![1],
              headers: [],
              schema: { type: 'string' },
            }),
          ),
        );

        jest.spyOn(JSONSchemaGenerator, 'generate').mockResolvedValue('example value chelsea');

        const mockResult = httpMocker
          .mock({
            resource: mockResource,
            input: mockInput,
          })
          .run(logger);

        assertRight(mockResult, result => expect(result).resolves.toMatchSnapshot());
      });
    });

    describe('when an example is defined', () => {
      describe('and dynamic flag is true', () => {
        describe('should generate a dynamic response', () => {
          const generatedExample = { hello: 'world' };

          beforeAll(() => {
            jest.spyOn(JSONSchemaGenerator, 'generate').mockResolvedValue(generatedExample);
          });

          afterAll(() => {
            jest.restoreAllMocks();
          });

          it('the dynamic response should not be an example one', async () => {
            const response = await httpMocker
              .mock({
                input: mockInput,
                resource: mockResource,
                config: { mock: { dynamic: true } },
              })
              .run(logger);

            expect(JSONSchemaGenerator.generate).not.toHaveBeenCalled();

            const allExamples = flatMap(mockResource.responses, res =>
              flatMap(res.contents, content => content.examples || []),
            ).map(x => {
              if ('value' in x) return x.value;
            });

            assertRight(response, async result => {
              const r = await result;
              expect(r.body).toBeDefined();

              allExamples.forEach(example => expect(r.body).not.toEqual(example));
              expect(r.body).toMatchObject({
                name: expect.any(String),
                surname: expect.any(String),
              });
            });
          });
        });
      });

      describe('and dynamic flag is false', () => {
        describe('and the example has been explicited', () => {
          it('should return the selected example', async () => {
            const response = await httpMocker
              .mock({
                input: mockInput,
                resource: mockResource,
                config: { mock: { dynamic: true, exampleKey: 'test key' } },
              })
              .run(logger);

            const selectedExample = flatMap(mockResource.responses, res =>
              flatMap(res.contents, content => content.examples || []),
            ).find(ex => ex.key === 'test key');
            expect(selectedExample).toBeDefined();

            assertRight(response, async result => {
              const resolved = await result;
              expect(resolved.body).toBeDefined();
              expect(resolved.body).toEqual((selectedExample as INodeExample).value);
            });
          });
        });
      });
    });
  });
});
