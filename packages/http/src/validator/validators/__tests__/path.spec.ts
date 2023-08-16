import { HttpParamStyles } from '@stoplight/types';
import { validate } from '../path';
import * as validateAgainstSchemaModule from '../utils';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';
import * as faker from '@faker-js/faker/locale/en';
import { ValidationContext } from '../types';

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });

  describe('spec is present', () => {
    describe('path param is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(
            validate(
              {},
              [{ id: faker.random.word(), name: 'aParam', style: HttpParamStyles.Simple, required: true }],
              ValidationContext.Input
            ),
            error =>
              expect(error).toEqual([
                {
                  code: 'required',
                  message: "Request path must have required property 'aparam'",
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
                validate(
                  { param: 'abc' },
                  [
                    {
                      id: faker.random.word(),
                      name: 'param',
                      style: HttpParamStyles.Simple,
                      schema: { type: 'string' },
                    },
                  ],
                  ValidationContext.Input
                )
              );

              expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
            });
          });
        });
      });

      describe('schema was not provided', () => {
        it('omits schema validation', () => {
          assertRight(
            validate(
              { param: 'abc' },
              [
                {
                  id: faker.random.word(),
                  name: 'param',
                  style: HttpParamStyles.Simple,
                },
              ],
              ValidationContext.Input
            )
          );

          expect(validateAgainstSchemaModule.validateAgainstSchema).toReturnWith(O.none);
        });
      });

      describe('deprecated flag is set', () => {
        it('returns deprecation warning', () => {
          assertLeft(
            validate(
              { param: 'abc' },
              [
                {
                  id: faker.random.word(),
                  name: 'param',
                  deprecated: true,
                  style: HttpParamStyles.Simple,
                },
              ],
              ValidationContext.Input
            ),
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
