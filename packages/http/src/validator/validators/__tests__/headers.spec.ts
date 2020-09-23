import { HttpParamStyles, DiagnosticSeverity } from '@stoplight/types';
import { validate } from '../headers';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });
  describe('spec is present', () => {
    describe('header is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(validate({}, [{ name: 'aHeader', style: HttpParamStyles.Simple, required: true }]), error =>
            expect(error).toContainEqual({
              code: 'required',
              message: "should have required property 'aheader'",
              path: ['header'],
              severity: 0,
            })
          );
        });
      });
    });

    describe('header is present', () => {
      describe('schema is present', () => {
        describe('deserializer is available', () => {
          describe('header is valid', () => {
            it('validates positively against schema', () => {
              assertRight(
                validate({ 'x-test-header': 'abc' }, [
                  {
                    name: 'x-test-header',
                    style: HttpParamStyles.Simple,
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
            validate({ 'x-test-header': 'abc' }, [
              {
                name: 'x-test-header',
                style: HttpParamStyles.Simple,
              },
            ])
          );

          expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
        });
      });

      describe('deprecated flag is set', () => {
        it('returns deprecation warning', () => {
          assertLeft(
            validate({ 'x-test-header': 'abc' }, [
              {
                name: 'x-test-header',
                deprecated: true,
                style: HttpParamStyles.Simple,
              },
            ]),
            error => expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Warning }))
          );
        });
      });
    });
  });
});
