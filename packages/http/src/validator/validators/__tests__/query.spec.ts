import { HttpParamStyles, DiagnosticSeverity } from '@stoplight/types';
import { validate } from '../query';
import * as validateAgainstSchemaModule from '../utils';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as O from 'fp-ts/Option';
import * as faker from '@faker-js/faker/locale/en';
import { ValidationContext } from '../types';

describe('validate()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateAgainstSchemaModule, 'validateAgainstSchema');
  });
  describe('spec is present', () => {
    describe('query param is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(
            validate(
              {},
              [{ id: faker.random.word(), name: 'aParam', style: HttpParamStyles.Form, required: true }],
              ValidationContext.Input
            ),
            error => expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Error }))
          );
        });
      });
    });

    describe('query param is present', () => {
      describe('schema is present', () => {
        describe('deserializer is available', () => {
          describe('query param is valid', () => {
            it('validates positively against schema', () => {
              assertRight(
                validate(
                  { param: 'abc' },
                  [
                    {
                      id: faker.random.word(),
                      name: 'param',
                      style: HttpParamStyles.Form,
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
                  style: HttpParamStyles.Form,
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
                  style: HttpParamStyles.Form,
                },
              ],
              ValidationContext.Input
            ),
            error => expect(error).toContainEqual(expect.objectContaining({ severity: DiagnosticSeverity.Warning }))
          );
        });
      });
    });
  });
});
