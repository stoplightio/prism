import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { query as registry } from '../../deserializers';
import { HttpQueryValidator } from '../query';
import * as validateAgainstSchemaModule from '../utils';

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
            expect(
              httpQueryValidator.validate({}, [{ name: 'aParam', style: HttpParamStyles.Form, required: true }]),
            ).toMatchSnapshot();
          });
        });
      });

      describe('header is present', () => {
        describe('schema is present', () => {
          describe('deserializer not available', () => {
            it('omits schema validation', () => {
              jest.spyOn(registry, 'get').mockReturnValueOnce(undefined);
              const param: IHttpQueryParam = {
                name: 'param',
                style: HttpParamStyles.Form,
                schema: { type: 'number' },
              };

              expect(httpQueryValidator.validate({ param: 'abc' }, [param])).toEqual([]);

              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
            });
          });

          describe('deserializer is available', () => {
            describe('query param is valid', () => {
              it('validates positively against schema', () => {
                expect(
                  httpQueryValidator.validate({ param: 'abc' }, [
                    {
                      name: 'param',
                      style: HttpParamStyles.Form,
                      schema: { type: 'string' },
                    },
                  ]),
                ).toEqual([]);

                expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
              });
            });
          });
        });

        describe('schema was not provided', () => {
          it('omits schema validation', () => {
            expect(
              httpQueryValidator.validate({ param: 'abc' }, [
                {
                  name: 'param',
                  style: HttpParamStyles.Form,
                },
              ]),
            ).toEqual([]);

            expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
          });
        });

        describe('deprecated flag is set', () => {
          it('returns deprecation warning', () => {
            expect(
              httpQueryValidator.validate({ param: 'abc' }, [
                {
                  name: 'param',
                  deprecated: true,
                  style: HttpParamStyles.Form,
                },
              ]),
            ).toMatchSnapshot();
          });
        });
      });
    });
  });
});
