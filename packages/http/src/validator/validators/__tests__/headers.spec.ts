import { HttpParamStyles, DiagnosticSeverity } from '@stoplight/types';
import { validate } from '../headers';
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
    describe('header is not present', () => {
      describe('spec defines it as required', () => {
        it('returns validation error', () => {
          assertLeft(
            validate(
              {},
              [{ id: faker.random.word(), name: 'aHeader', style: HttpParamStyles.Simple, required: true }],
              ValidationContext.Input
            ),
            error =>
              expect(error).toContainEqual({
                code: 'required',
                message: "Request header must have required property 'aheader'",
                path: ['header'],
                severity: 0,
              })
          );
        });
      });
    });

    describe('header is present', () => {
      describe('schema is present', () => {
        describe('deserializer is available', () => {
          describe('header is valid', () => {
            it('validates positively against schema', () => {
              assertRight(
                validate(
                  { 'x-test-header': 'abc' },
                  [
                    {
                      id: faker.random.word(),
                      name: 'x-test-header',
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
              { 'x-test-header': 'abc' },
              [
                {
                  id: faker.random.word(),
                  name: 'x-test-header',
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
              { 'x-test-header': 'abc' },
              [
                {
                  id: faker.random.word(),
                  name: 'x-test-header',
                  deprecated: true,
                  style: HttpParamStyles.Simple,
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
