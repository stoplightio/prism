import { DiagnosticSeverity, HttpParamStyles } from '@stoplight/types';
import { httpInputs, httpOperations, httpOutputs } from '../../__tests__/fixtures';
import { validateInput, validateOutput } from '../index';

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
  headers: { 'x-todos-publish': 'yesterday' },
});

describe('HttpValidator', () => {
  describe('validateInput()', () => {
    describe('all validations are turned on', () => {
      it('returns validation errors for whole request structure', () => {
        expect(validateInput({ resource: httpOperations[2], element: BAD_INPUT })).toMatchSnapshot();
      });

      describe('when all required params are provided', () => {
        it('returns no validation errors', () => {
          expect(validateInput({ resource: httpOperations[0], element: GOOD_INPUT })).toEqual([]);
        });
      });
    });

    describe('headers validation', () => {
      it('is case insensitive', () => {
        expect(
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
          }),
        ).toEqual([]);
      });
    });

    describe('query validation', () => {
      it('returns only query validation errors', () => {
        expect(
          validateInput({
            resource: httpOperations[2],
            element: BAD_INPUT,
          }),
        ).toContainEqual({
          code: 'pattern',
          message: 'should match pattern "^(yes|no)$"',
          path: ['query', 'overwrite'],
          severity: DiagnosticSeverity.Error,
        });
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
