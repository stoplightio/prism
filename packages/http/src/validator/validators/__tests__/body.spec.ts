import { HttpParamStyles } from '@stoplight/types';
import { JSONSchema } from '../../..';
import { HttpBodyValidator } from '../body';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/utils/__tests__/utils';

describe('HttpBodyValidator', () => {
  const httpBodyValidator = new HttpBodyValidator('body');

  describe('validate()', () => {
    describe('content specs are missing', () => {
      it('returns no validation errors', () => {
        assertRight(httpBodyValidator.validate('test', []));
      });
    });

    describe('request media type is not provided', () => {
      it('returns no validation errors', () => {
        assertRight(
          httpBodyValidator.validate('test', [
            { mediaType: 'application/not-exists-son', examples: [], encodings: [] },
          ]));
      });
    });

    describe('request media type was not found in spec', () => {
      it('returns no validation errors', () => {
        assertRight(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
            'application/json',
          ));
      });
    });

    describe('body schema is provided', () => {
      it('return validation errors', () => {
        const mockSchema: JSONSchema = { type: 'number' };
        assertLeft(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
            'application/json',
          ), error => expect(error).toContainEqual(expect.objectContaining({ code: "type", message: "should be number" })));
      });
    });

    describe('body is form-urlencoded with deep object style', () => {
      it('returns no validation errors', () => {
        assertRight(
          httpBodyValidator.validate(
            encodeURI('key[a]=str'),
            [
              {
                mediaType: 'application/x-www-form-urlencoded',
                encodings: [{ property: 'key', style: HttpParamStyles.DeepObject }],
                schema: {
                  type: 'object',
                  properties: {
                    key: {
                      type: 'object',
                      properties: { a: { type: 'string' } },
                      required: ['a'],
                    },
                  },
                  required: ['key'],
                },
              },
            ],
            'application/x-www-form-urlencoded',
          ));
      });
    });

    describe('body is form-urlencoded with deep object style and is not compatible with schema', () => {
      it('returns validation errors', () => {
        assertLeft(
          httpBodyValidator.validate(
            encodeURI('key[a][ab]=str'),
            [
              {
                mediaType: 'application/x-www-form-urlencoded',
                encodings: [{ property: 'key', style: HttpParamStyles.DeepObject }],
                schema: {
                  type: 'object',
                  properties: {
                    key: {
                      type: 'object',
                      properties: {
                        a: {
                          type: 'object',
                          properties: { aa: { type: 'string' } },
                          required: ['aa'],
                        },
                      },
                      required: ['a'],
                    },
                  },
                  required: ['key'],
                },
              },
            ],
            'application/x-www-form-urlencoded',
          ), error => expect(error).toContainEqual(expect.objectContaining({
            code: 'required', message: 'should have required property \'aa\''
          })))
      });
    });
  });
});
