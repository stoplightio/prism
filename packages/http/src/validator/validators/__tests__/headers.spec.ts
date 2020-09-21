import { HttpParamStyles, DiagnosticSeverity } from '@stoplight/types';
import { header } from '../../deserializers';
import { HttpHeadersValidator } from '../headers';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';

describe('HttpHeadersValidator', () => {
  const httpHeadersValidator = new HttpHeadersValidator(header, 'header');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('validate()', () => {
    describe('spec is present', () => {
      describe('header is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            assertLeft(
              httpHeadersValidator.validate({}, [{ name: 'aHeader', style: HttpParamStyles.Simple, required: true }]),
              error =>
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
                  httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
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
              httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
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
              httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
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
});
