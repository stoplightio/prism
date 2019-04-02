import { HttpParamStyles, ISchema } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from '../../deserializers/registry';
import * as resolveContentModule from '../../utils/http';
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
    jest
      .spyOn(resolveContentModule, 'resolveContent')
      .mockImplementation(contentSpecs => contentSpecs[Object.keys(contentSpecs)[0]]);
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema').mockImplementation(() => []);
  });

  describe('validate()', () => {
    describe('spec is present', () => {
      describe('query param is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            expect(
              httpQueryValidator.validate({}, [
                { name: 'aParam', style: HttpParamStyles.Form, required: true, contents: [] },
              ])
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
                    contents: [
                      { mediaType: '*', schema: { type: 'number' }, examples: [], encodings: [] },
                    ],
                  },
                ])
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
                      contents: [
                        { mediaType: '*', schema: { type: 'string' }, examples: [], encodings: [] },
                      ],
                    },
                  ])
                ).toEqual([]);

                expect(validateAgainstSchemaModule.validateAgainstSchema).toHaveBeenCalled();
              });
            });
          });
        });

        describe('content was not found', () => {
          it('omits schema validation', () => {
            jest
              .spyOn(resolveContentModule, 'resolveContent')
              .mockReturnValueOnce({ encodings: [], examples: [], mediaType: 'application/json' });

            expect(
              httpQueryValidator.validate(
                { param: 'abc' },
                [
                  {
                    name: 'param',
                    style: HttpParamStyles.Form,
                    contents: [
                      { mediaType: '*', schema: { type: 'number' }, examples: [], encodings: [] },
                    ],
                  },
                ],
                'application/testson'
              )
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
                  contents: [],
                },
              ])
            ).toMatchSnapshot();
          });
        });
      });
    });
  });
});
