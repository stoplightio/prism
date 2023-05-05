import { DiagnosticSeverity, HttpParamStyles, IHttpOperation } from '@stoplight/types';
import { httpInputs, httpOperations, httpOutputs } from '../../__tests__/fixtures';
import { validateInput, validateOutput } from '../index';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as faker from '@faker-js/faker/locale/en';

const BAD_INPUT = Object.assign({}, httpInputs[2], {
  body: { name: 'Shopping', completed: 'yes' },
  url: Object.assign({}, httpInputs[2].url, { query: { overwrite: 'true' } }),
  headers: { 'x-todos-publish': 'yesterday' },
});

const GOOD_INPUT = Object.assign({}, httpInputs[2], {
  url: Object.assign({}, httpInputs[0].url, { query: { completed: true } }),
});

const BAD_OUTPUT = Object.assign({}, httpOutputs[1], {
  body: { name: 'Shopping', completed: 'yes' },
  headers: { 'x-todos-publish': 'yesterday', 'content-type': 'application/something' },
});

describe('HttpValidator', () => {
  describe('validateInput()', () => {
    describe('all validations are turned on', () => {
      it('returns validation errors for whole request structure', () => {
        expect(validateInput({ resource: httpOperations[2], element: BAD_INPUT })).toMatchSnapshot();
      });

      it.each(['yesterday', '', '2021-02-18T12:02:16.49Z', '2021-02-18T12:02:16.49'])(
        'properly validate date-time format ("%s")',
        (dateValue: string) => {
          expect(
            validateInput({
              resource: {
                id: '?http-operation-id?',
                method: 'get',
                path: '/todos',
                responses: [
                  {
                    id: faker.random.word(),
                    code: '200',
                  },
                ],
                request: {
                  query: [
                    {
                      id: faker.random.word(),
                      name: 'updated_since',
                      schema: {
                        type: 'string',
                        format: 'date-time',
                        $schema: 'http://json-schema.org/draft-07/schema#',
                      },
                      style: HttpParamStyles.Form,
                    },
                  ],
                  cookie: [],
                  path: [],
                },
              },
              element: {
                method: 'get',
                url: { path: '/todos', query: { updated_since: dateValue } },
              },
            })
          ).toMatchSnapshot();
        }
      );

      describe('when all required params are provided', () => {
        it('returns no validation errors', () => {
          assertRight(validateInput({ resource: httpOperations[0], element: GOOD_INPUT }));
        });
      });
    });

    describe('deprecated keyword validation', () => {
      const resource: IHttpOperation = {
        id: 'abc',
        method: 'get',
        path: '/test',
        responses: [
          {
            id: faker.random.word(),
            code: '200',
          },
        ],
        request: {
          query: [
            {
              id: faker.random.word(),
              style: HttpParamStyles.Form,
              deprecated: true,
              name: 'productId',
            },
          ],
        },
      };

      it('returns warnings', () => {
        assertLeft(
          validateInput({
            resource,
            element: {
              method: 'get',
              url: {
                path: '/test',
                query: {
                  productId: 'abc',
                },
              },
            },
          }),
          error =>
            expect(error).toEqual([
              {
                code: 'deprecated',
                message: 'Query param productId is deprecated',
                path: ['query', 'productId'],
                severity: DiagnosticSeverity.Warning,
              },
            ])
        );
      });

      it('does not return warnings', () => {
        assertRight(
          validateInput({
            resource,
            element: {
              method: 'get',
              url: {
                path: '/test',
                query: {},
              },
            },
          })
        );
      });
    });

    describe('headers validation', () => {
      it('is case insensitive', () => {
        assertRight(
          validateInput({
            resource: {
              method: 'GET',
              path: '/hey',
              responses: [
                {
                  id: faker.random.word(),
                  code: '200',
                },
              ],
              id: 'hey',
              request: {
                headers: [
                  {
                    id: faker.random.word(),
                    name: 'API_KEY',
                    style: HttpParamStyles.Simple,
                    schema: {
                      type: 'string',
                    },
                    required: true,
                  },
                ],
              },
            },
            element: {
              method: 'get',
              url: {
                path: '/hey',
              },
              headers: {
                api_Key: 'ha',
              },
            },
          })
        );
      });
    });

    describe('query validation', () => {
      it('returns only query validation errors', () => {
        assertLeft(
          validateInput({
            resource: httpOperations[2],
            element: BAD_INPUT,
          }),
          error =>
            expect(error).toContainEqual({
              code: 'pattern',
              message: 'Request query parameter overwrite must match pattern "^(yes|no)$"',
              path: ['query', 'overwrite'],
              severity: DiagnosticSeverity.Error,
            })
        );
      });
    });
  });

  describe('validateOutput()', () => {
    describe('all validations are turned on', () => {
      it('returns validation errors for whole request structure', () => {
        expect(validateOutput({ resource: httpOperations[1], element: BAD_OUTPUT })).toMatchSnapshot();
      });
    });
  });
});
