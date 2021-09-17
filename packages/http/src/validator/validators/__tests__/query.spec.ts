import { HttpParamStyles, DiagnosticSeverity, IHttpQueryParam } from '@stoplight/types';
import { validate as validateQuery } from '../query';
import { IHttpNameValues } from '../../../types';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';
import { createJsonSchemaFromParams } from '../params';

const validate = (target: IHttpNameValues, specs: IHttpQueryParam[]) => {
  return validateQuery(target, specs, createJsonSchemaFromParams(specs));
};

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });
  describe('spec is present', () => {
    describe('query param is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(validate({}, [{ name: 'aParam', style: HttpParamStyles.Form, required: true }]), error =>
            expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Error }))
          );
        });
      });
    });

    describe('query param is present', () => {
      describe('schema is present', () => {
        describe('deserializer is available', () => {
          describe('query param is valid', () => {
            it('validates positively against schema', () => {
              assertRight(
                validate({ param: 'abc' }, [
                  {
                    name: 'param',
                    style: HttpParamStyles.Form,
                    schema: { type: 'string' },
                  },
                ])
              );

              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
            });
          });
        });
      });

      describe('schema was not provided', () => {
        it('omits schema validation', () => {
          assertRight(
            validate({ param: 'abc' }, [
              {
                name: 'param',
                style: HttpParamStyles.Form,
              },
            ])
          );

          expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
        });
      });

      describe('deprecated flag is set', () => {
        it('returns deprecation warning', () => {
          assertLeft(
            validate({ param: 'abc' }, [
              {
                name: 'param',
                deprecated: true,
                style: HttpParamStyles.Form,
              },
            ]),
            error => expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Warning }))
          );
        });
      });
    });
  });
});
