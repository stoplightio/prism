import { HttpParamStyles, IHttpQueryParam, DiagnosticSeverity } from '@stoplight/types';
import { query as registry } from '../../deserializers';
import { HttpQueryValidator } from '../query';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/lib/Option';

describe('HttpQueryValidator', () => {
  const httpQueryValidator = new HttpQueryValidator(registry, 'query');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(registry, 'get');
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('validate()', () => {
    describe('spec is present', () => {
      describe('query param is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            assertLeft(
              httpQueryValidator.validate({}, [{ name: 'aParam', style: HttpParamStyles.Form, required: true }]),
              error => expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Error }))
            );
          });
        });
      });

      describe('query param is present', () => {
        describe('schema is present', () => {
          describe('deserializer not available', () => {
            it('omits schema validation', () => {
              jest.spyOn(registry, 'get').mockReturnValueOnce(undefined);
              const param: IHttpQueryParam = {
                name: 'param',
                style: HttpParamStyles.Form,
                schema: { type: 'number' },
              };

              assertRight(httpQueryValidator.validate({ param: 'abc' }, [param]));

              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
            });
          });

          describe('deserializer is available', () => {
            describe('query param is valid', () => {
              it('validates positively against schema', () => {
                assertRight(
                  httpQueryValidator.validate({ param: 'abc' }, [
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
              httpQueryValidator.validate({ param: 'abc' }, [
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
              httpQueryValidator.validate({ param: 'abc' }, [
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
});
