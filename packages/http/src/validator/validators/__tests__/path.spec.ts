import { HttpParamStyles } from '@stoplight/types';
import { path as registry } from '../../deserializers';
import { validate } from '../path';
import * as validateAgainstSchemaModule from '../utils';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('spec is present', () => {
    describe('path param is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(validate({}, [{ name: 'aParam', style: HttpParamStyles.Simple, required: true }]), error =>
            expect(error).toEqual([
              {
                code: 'required',
                message: "must have required property 'aparam'",
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
        describe('deserializer is available', () => {
          describe('path param is valid', () => {
            it('validates positively against schema', () => {
              assertRight(
                validate({ param: 'abc' }, [
                  {
                    name: 'param',
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
            validate({ param: 'abc' }, [
              {
                name: 'param',
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
            validate({ param: 'abc' }, [
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
