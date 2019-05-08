import { HttpParamStyles, ISchema } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from '../../deserializers/registry';
import * as resolveContentModule from '../../utils/http';
import { HttpHeadersValidator } from '../headers';
import * as validateAgainstSchemaModule from '../utils';

describe('HttpHeadersValidator', () => {
  const registry = new HttpParamDeserializerRegistry([
    {
      supports: (_style: HttpParamStyles) => true,
      deserialize: (_name: string, _parameters: any, _schema: ISchema) => ({}),
    },
  ]);
  const httpHeadersValidator = new HttpHeadersValidator(registry, 'header');

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
      describe('header is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            expect(
              httpHeadersValidator.validate({}, [
                { name: 'aHeader', style: HttpParamStyles.Simple, required: true, contents: [] },
              ]),
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
                httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
                  {
                    name: 'x-test-header',
                    style: HttpParamStyles.Simple,
                    contents: [{ mediaType: '*', schema: { type: 'number' }, examples: [], encodings: [] }],
                  },
                ]),
              ).toEqual([]);

              expect(validateAgainstSchemaModule.validateAgainstSchema).not.toHaveBeenCalled();
            });
          });

          describe('deserializer is available', () => {
            describe('header is valid', () => {
              it('validates positively against schema', () => {
                expect(
                  httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
                    {
                      name: 'x-test-header',
                      style: HttpParamStyles.Simple,
                      contents: [{ mediaType: '*', schema: { type: 'string' }, examples: [], encodings: [] }],
                    },
                  ]),
                ).toEqual([]);

                expect(validateAgainstSchemaModule.validateAgainstSchema).toHaveBeenCalled();
              });
            });
          });
        });

        describe('content was not found', () => {
          it('omits schema validation', () => {
            jest.spyOn(resolveContentModule, 'resolveContent').mockReturnValueOnce({
              mediaType: 'application/exists-son',
              examples: [],
              encodings: [],
            });

            expect(
              httpHeadersValidator.validate(
                { 'x-test-header': 'abc' },
                [
                  {
                    name: 'x-test-header',
                    style: HttpParamStyles.Simple,
                    contents: [{ mediaType: '*', schema: { type: 'number' }, examples: [], encodings: [] }],
                  },
                ],
                'application/testson',
              ),
            ).toEqual([]);

            expect(registry.get).not.toHaveBeenCalled();
            expect(validateAgainstSchemaModule.validateAgainstSchema).not.toHaveBeenCalled();
          });
        });

        describe('deprecated flag is set', () => {
          it('returns deprecation warning', () => {
            expect(
              httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
                {
                  name: 'x-test-header',
                  deprecated: true,
                  style: HttpParamStyles.Simple,
                  contents: [],
                },
              ]),
            ).toMatchSnapshot();
          });
        });
      });
    });
  });
});
