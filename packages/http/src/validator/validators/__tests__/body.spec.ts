import { HttpParamStyles } from '@stoplight/types';
import { JSONSchema } from '../../..';
import { HttpBodyValidator } from '../body';

describe('HttpBodyValidator', () => {
  const httpBodyValidator = new HttpBodyValidator('body');

  describe('validate()', () => {
    describe('content specs are missing', () => {
      it('returns no validation errors', () => {
        expect(httpBodyValidator.validate('test', [])).toEqual([]);
      });
    });

    describe('request media type is not provided', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate('test', [
            { mediaType: 'application/not-exists-son', examples: [], encodings: [] },
          ]),
        ).toEqual([]);
      });
    });

    describe('request media type was not found in spec', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
            'application/json',
          ),
        ).toEqual([]);
      });
    });

    describe('body schema is provided', () => {
      it('return validation errors', () => {
        const mockSchema: JSONSchema = { type: 'number' };
        expect(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
            'application/json',
          ),
        ).toMatchSnapshot();
      });
    });

    describe('body is form-urlencoded with deep object style', () => {
      it('returns no validation errors', () => {
        expect(
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
          ),
        ).toEqual([]);
      });
    });

    describe('body is form-urlencoded with deep object style and is not compatible with schema', () => {
      it('returns validation errors', () => {
        expect(
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
          ),
        ).toMatchSnapshot();
      });
    });
  });
});
