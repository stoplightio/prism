import { DiagnosticSeverity, HttpParamStyles } from '@stoplight/types';
import { httpInputs, httpOperations, httpOutputs } from '../../__tests__/fixtures';
import { IHttpConfig } from '../../types';
import { validator } from '../index';

const defaultConfig: IHttpConfig = { mock: { dynamic: false }, validateRequest: true, validateResponse: true };

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
      it('returns validation errors for whole request structure', async () => {
        expect(await validator.validateInput({ resource: httpOperations[2], input: BAD_INPUT })).toMatchSnapshot();
      });

      describe('when all required params are provided', () => {
        it('returns no validation errors', async () => {
          expect(await validator.validateInput({ resource: httpOperations[0], input: GOOD_INPUT })).toEqual([]);
        });
      });
    });

    describe('headers validation', () => {
      it('is case insensitive', async () => {
        expect(
          await validator.validateInput({
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
            input: {
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
          validator.validateInput({
            resource: httpOperations[2],
            input: BAD_INPUT,
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
      it('returns validation errors for whole request structure', async () => {
        expect(await validator.validateOutput({ resource: httpOperations[1], output: BAD_OUTPUT })).toMatchSnapshot();
      });
    });
  });
});
