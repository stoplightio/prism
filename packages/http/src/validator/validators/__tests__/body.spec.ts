import { HttpParamStyles, IMediaTypeContent } from '@stoplight/types';
import { JSONSchema } from '../../..';
import { validate, findContentByMediaTypeOrFirst } from '../body';
import { assertRight, assertLeft, assertSome } from '@stoplight/prism-core/src/__tests__/utils';

describe('validate()', () => {
  describe('content specs are missing', () => {
    it('returns no validation errors', () => {
      assertRight(validate('test', []));
    });
  });

  describe('request media type is not provided', () => {
    it('returns no validation errors', () => {
      assertRight(validate('test', [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }]));
    });
  });

  describe('request media type was not found in spec', () => {
    it('returns no validation errors', () => {
      assertRight(
        validate('test', [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }], 'application/json')
      );
    });
  });

  describe('body schema is provided', () => {
    it('return validation errors', () => {
      const mockSchema: JSONSchema = { type: 'number' };
      assertLeft(
        validate(
          'test',
          [{ mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
          'application/json'
        ),
        error => expect(error).toContainEqual(expect.objectContaining({ code: 'type', message: 'should be number' }))
      );
    });
  });

  describe('body is form-urlencoded with deep object style', () => {
    it('returns no validation errors', () => {
      assertRight(
        validate(
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
          'application/x-www-form-urlencoded'
        )
      );
    });
  });

  describe('body is form-urlencoded with deep object style and is not compatible with schema', () => {
    it('returns validation errors', () => {
      assertLeft(
        validate(
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
          'application/x-www-form-urlencoded'
        ),
        error =>
          expect(error).toContainEqual(
            expect.objectContaining({
              code: 'required',
              message: "should have required property 'aa'",
            })
          )
      );
    });
  });
});

describe('findContentByMediaTypeOrFirst()', () => {
  describe('when a spec has a content type', () => {
    const content: IMediaTypeContent = {
      mediaType: 'application/x-www-form-urlencoded',
    };

    describe('and I request for the content type with the charset', () => {
      const foundContent = findContentByMediaTypeOrFirst([content], 'application/x-www-form-urlencoded; charset=UTF-8');

      it('should return the generic content', () => assertSome(foundContent));
    });
  });
});
