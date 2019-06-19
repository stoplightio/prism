import { DiagnosticSeverity } from '@stoplight/types';

import { JSONSchema } from '../../..';
import { HttpBodyValidator } from '../body';
import { IValidatorRegistry } from '../types';

describe('HttpBodyValidator', () => {
  const validatorRegistry = { get: () => () => [] } as IValidatorRegistry;
  const httpBodyValidator = new HttpBodyValidator(validatorRegistry, 'body');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validatorRegistry, 'get');
  });

  describe('validate()', () => {
    describe('content specs are missing', () => {
      it('returns no validation errors', () => {
        expect(httpBodyValidator.validate('test', [])).toEqual([]);
        expect(validatorRegistry.get).not.toHaveBeenCalled();
      });
    });

    describe('request media type is not provided', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate('test', [
            { mediaType: 'application/not-exists-son', examples: [], encodings: [] },
          ]),
        ).toEqual([]);
        expect(validatorRegistry.get).not.toHaveBeenCalled();
      });
    });

    describe('request media type was not found in spec', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
            'application/json',
          ),
        ).toEqual([]);
        expect(validatorRegistry.get).not.toHaveBeenCalled();
      });
    });

    describe('body schema is provided', () => {
      describe('validator for given media type does not exists', () => {
        it('return no validation errors', () => {
          const validatorRegistryGetSpy = jest.spyOn(validatorRegistry, 'get');

          expect(
            httpBodyValidator.validate(
              'test',
              [{ mediaType: 'application/json', schema: {}, examples: [], encodings: [] }],
              'application/json',
            ),
          ).toEqual([]);

          expect(validatorRegistryGetSpy).toHaveBeenCalledWith('application/json');
          expect(validatorRegistryGetSpy).toHaveBeenCalledTimes(1);
        });
      });

      describe('validator for given media type exists', () => {
        it('return validation errors', () => {
          const mockSchema: JSONSchema = { type: 'string' };

          jest.spyOn(validatorRegistry, 'get').mockImplementation(mediaType => {
            expect(mediaType).toBe('application/json');
            return (content: any, schema: JSONSchema) => {
              expect(content).toEqual('test');
              expect(schema).toEqual(mockSchema);
              return [
                {
                  path: ['a'],
                  code: 'testName',
                  severity: DiagnosticSeverity.Error,
                  message: 'testMessage',
                },
              ];
            };
          });

          expect(
            httpBodyValidator.validate(
              'test',
              [{ mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
              'application/json',
            ),
          ).toMatchSnapshot();

          expect(validatorRegistry.get).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
