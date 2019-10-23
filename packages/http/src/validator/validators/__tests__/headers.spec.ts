import { HttpParamStyles } from '@stoplight/types';
import { query as registry } from '../../deserializers';
import { HttpHeadersValidator } from '../headers';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight } from '@stoplight/prism-core/src/utils/__tests__/utils';

describe('HttpHeadersValidator', () => {
  const httpHeadersValidator = new HttpHeadersValidator(registry, 'header');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(registry, 'get');
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('validate()', () => {
    describe('spec is present', () => {
      describe('header is not present', () => {
        describe('spec defines it as required', () => {
          it('returns validation error', () => {
            expect(
              httpHeadersValidator.validate({}, [{ name: 'aHeader', style: HttpParamStyles.Simple, required: true }]),
            ).toMatchSnapshot();
          });
        });
      });

      describe('header is present', () => {
        describe('schema is present', () => {
          describe('deserializer not available', () => {
            it('omits schema validation', () => {
              jest.spyOn(registry, 'get').mockReturnValueOnce(undefined);

              assertRight(
                httpHeadersValidator.validate({ 'x-test-header': 'abc' }, [
                  {
                    name: 'x-test-header',
                    style: HttpParamStyles.Simple,
                    schema: { type: 'number' },
                  },
                ]),
              );

              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
            });
          });

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
                  ]),
                );

                expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
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
              ]),
            );

            expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith([]);
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
                },
              ]),
            ).toMatchSnapshot();
          });
        });
      });
    });
  });
});
