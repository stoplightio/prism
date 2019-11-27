import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { path as registry } from '../../deserializers';
import { HttpPathValidator } from '../path';
import * as validateAgainstSchemaModule from '../utils';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import * as Option from 'fp-ts/lib/Option';

describe('HttpPathValidator', () => {
  const httpPathValidator = new HttpPathValidator(registry, 'path');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(registry, 'get');
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('validate()', () => {
    describe('spec is present', () => {
      describe('path param is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            assertLeft(
              httpPathValidator.validate({}, [{ name: 'aParam', style: HttpParamStyles.Simple, required: true }]),
              error =>
                expect(error).toEqual([
                  {
                    code: 'required',
                    message: "should have required property 'aparam'",
                    path: ['path'],
                    severity: 0,
                  },
                ])
            );
          });
        });
      });

      describe('path param is present', () => {
        describe('schema is present', () => {
          describe('deserializer not available', () => {
            it('omits schema validation', () => {
              jest.spyOn(registry, 'get').mockReturnValueOnce(undefined);
              const param: IHttpPathParam = {
                name: 'param',
                style: HttpParamStyles.Simple,
                schema: { type: 'number' },
              };

              assertRight(httpPathValidator.validate({ param: 'abc' }, [param]));
              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(Option.some([]));
            });
          });

          describe('deserializer is available', () => {
            describe('path param is valid', () => {
              it('validates positively against schema', () => {
                assertRight(
                  httpPathValidator.validate({ param: 'abc' }, [
                    {
                      name: 'param',
                      style: HttpParamStyles.Simple,
                      schema: { type: 'string' },
                    },
                  ])
                );

                expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(Option.some([]));
              });
            });
          });
        });

        describe('schema was not provided', () => {
          it('omits schema validation', () => {
            assertRight(
              httpPathValidator.validate({ param: 'abc' }, [
                {
                  name: 'param',
                  style: HttpParamStyles.Simple,
                },
              ])
            );

            expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(Option.some([]));
          });
        });

        describe('deprecated flag is set', () => {
          it('returns deprecation warning', () => {
            assertLeft(
              httpPathValidator.validate({ param: 'abc' }, [
                {
                  name: 'param',
                  deprecated: true,
                  style: HttpParamStyles.Simple,
                },
              ]),
              error =>
                expect(error).toEqual([
                  {
                    code: 'deprecated',
                    message: 'Path param param is deprecated',
                    path: ['path', 'param'],
                    severity: 1,
                  },
                ])
            );
          });
        });
      });
    });
  });
});
