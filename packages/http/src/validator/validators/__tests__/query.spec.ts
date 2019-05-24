import { HttpParamStyles, ISchema } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from '../../deserializers/registry';
import { HttpQueryValidator } from '../query';
import * as validateAgainstSchemaModule from '../utils';

describe('HttpQueryValidator', () => {
  const registry = new HttpParamDeserializerRegistry([
    {
      supports: (_style: HttpParamStyles) => true,
      deserialize: (_name: string, _parameters: any, _schema: ISchema) => ({}),
    },
  ]);
  const httpQueryValidator = new HttpQueryValidator(registry, 'query');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(registry, 'get');
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema').mockImplementation(() => []);
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

              expect(
                httpQueryValidator.validate({ param: 'abc' }, [
                  {
                    name: 'param',
                    style: HttpParamStyles.Form,
                    content: { schema: { type: 'number' }, examples: [], encodings: [] },
                  },
                ]),
              ).toEqual([]);

              expect(validateAgainstSchemaModule.validateAgainstSchema).not.toHaveBeenCalled();
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
                      content: { schema: { type: 'string' }, examples: [], encodings: [] },
                    },
                  ]),
                ).toEqual([]);

                expect(validateAgainstSchemaModule.validateAgainstSchema).toHaveBeenCalled();
              });
            });
          });
        });

        describe('content was not provided', () => {
          it('omits schema validation', () => {
            expect(
              httpQueryValidator.validate({ param: 'abc' }, [
                {
                  name: 'param',
                  style: HttpParamStyles.Form,
                },
              ]),
            ).toEqual([]);

            expect(registry.get).not.toHaveBeenCalled();
            expect(validateAgainstSchemaModule.validateAgainstSchema).not.toHaveBeenCalled();
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
