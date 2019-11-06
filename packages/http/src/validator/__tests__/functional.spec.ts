import { DiagnosticSeverity, HttpParamStyles, IHttpOperation } from '@stoplight/types';
import { httpInputs, httpOperations, httpOutputs } from '../../__tests__/fixtures';
import { validateInput, validateOutput } from '../index';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';

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
            code: '200',
          },
        ],
        request: {
          query: [
            {
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
                  code: '200',
                },
              ],
              id: 'hey',
              request: {
                headers: [
                  {
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
              message: 'should match pattern "^(yes|no)$"',
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
