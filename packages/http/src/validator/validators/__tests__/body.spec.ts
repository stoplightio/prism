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
            encodeURI(
              'key[a]=str&key[b][ba]=str&key[b][bc][0]=bc0&key[b][bc][1]=bc1&key[c][0][a]=c0a&key[c][0][b]=c0b&key[c][1][a]=c0a&key[c][1][b]=c0b&other=other',
            ),
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
                        a: { type: 'string' },
                        b: {
                          type: 'object',
                          properties: {
                            ba: { type: 'string' },
                            bb: { type: 'object' },
                            bc: { type: 'array' },
                          },
                          required: ['ba', 'bb', 'bc'],
                        },
                        c: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              a: { type: 'string' },
                              b: { type: 'string' },
                            },
                            required: ['a', 'b'],
                          },
                        },
                      },
                      required: ['a', 'b', 'c'],
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
  });
});
