import { HttpParamStyles, IMediaTypeContent } from '@stoplight/types';
import { JSONSchema } from '../../..';
import { validate, findContentByMediaTypeOrFirst, decodeUriEntities } from '../body';
import { assertRight, assertLeft, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { ValidationContext } from '../types';
import * as faker from '@faker-js/faker/locale/en';

describe('validate()', () => {
  describe('content specs are missing', () => {
    it('returns no validation errors', () => {
      assertRight(validate('test', [], ValidationContext.Input));
    });
  });

  describe('request media type is not provided', () => {
    it('returns no validation errors', () => {
      assertRight(
        validate(
          'test',
          [{ id: faker.random.word(), mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
          ValidationContext.Input
        )
      );
    });
  });

  describe('request media type was not found in spec', () => {
    it('returns no validation errors', () => {
      assertRight(
        validate(
          'test',
          [{ id: faker.random.word(), mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
          ValidationContext.Input,
          'application/json'
        )
      );
    });
  });

  describe('body schema is provided', () => {
    it('return validation errors', () => {
      const mockSchema: JSONSchema = { type: 'number' };
      assertLeft(
        validate(
          'test',
          [{ id: faker.random.word(), mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
          ValidationContext.Input,
          'application/json'
        ),
        error =>
          expect(error).toContainEqual(
            expect.objectContaining({ code: 'type', message: 'Request body must be number' })
          )
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
              id: faker.random.word(),
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
          ValidationContext.Input,
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
              id: faker.random.word(),
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
          ValidationContext.Input,
          'application/x-www-form-urlencoded'
        ),
        error =>
          expect(error).toContainEqual(
            expect.objectContaining({
              code: 'required',
              message: "Request body property key.a must have required property 'aa'",
            })
          )
      );
    });
  });

  describe('readOnly writeOnly parameters', () => {
    const specs: IMediaTypeContent[] = [
      {
        id: faker.random.word(),
        mediaType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
              writeOnly: true,
            },
            title: {
              type: 'string',
              readOnly: true,
            },
          },
          required: ['name', 'description', 'title'],
        },
      },
    ];
    it('requires writeOnly params from input', () => {
      assertLeft(validate({ name: 'Item One' }, specs, ValidationContext.Input, 'application/json'), error => {
        expect(error[0].message).toEqual("Request body must have required property 'description'");
      });
    });
    it('succeed when writeOnly params are provided', () => {
      assertRight(
        validate(
          { name: 'Item One', description: 'some description' },
          specs,
          ValidationContext.Input,
          'application/json'
        )
      );
    });
    it('requires readOnly params from output', () => {
      assertLeft(validate({ name: 'Item One' }, specs, ValidationContext.Output, 'application/json'), error => {
        expect(error[0].message).toEqual("Response body must have required property 'title'");
      });
    });
    it('succeed when readOnly params are provided', () => {
      assertRight(validate({ name: 'Item One', title: 'title' }, specs, ValidationContext.Output, 'application/json'));
    });
  });

  describe('merge allOf', () => {
    it('nested below top-level', () => {
      // Arrange
      const schemas: IMediaTypeContent[] = [
        {
          id: faker.random.word(),
          mediaType: 'application/json',
          schema: {
            type: 'object',
            required: ['level1'],
            properties: {
              level1: {
                type: 'object',
                required: ['level2'],
                properties: {
                  level2: {
                    allOf: [{ description: 'a description' }, { type: 'string' }],
                  },
                },
              },
            },
          },
        },
      ];

      // Act
      const actual = validate({ level1: { level2: 'abc' } }, schemas, ValidationContext.Output, 'application/json');

      // Assert
      assertRight(actual);
    });
    it('does NOT require writeOnly params in output', () => {
      // Arrange
      const schemas: IMediaTypeContent[] = [
        {
          id: faker.random.word(),
          mediaType: 'application/json',
          schema: {
            type: 'object',
            required: ['name', 'writeOnlyProperty'],
            properties: {
              name: {
                type: 'string',
              },
              writeOnlyProperty: {
                allOf: [{ writeOnly: true }, { type: 'string' }],
              },
            },
          },
        },
      ];

      // Act
      const actual = validate({ name: 'Ann' }, schemas, ValidationContext.Output, 'application/json');

      // Assert
      assertRight(actual);
    });
    it('does NOT require readOnly params in input', () => {
      // Arrange
      const schemas: IMediaTypeContent[] = [
        {
          id: faker.random.word(),
          mediaType: 'application/json',
          schema: {
            type: 'object',
            required: ['name', 'readOnlyProperty'],
            properties: {
              name: {
                type: 'string',
              },
              readOnlyProperty: {
                allOf: [{ readOnly: true }, { type: 'string' }],
              },
            },
          },
        },
      ];

      // Act
      const actual = validate({ name: 'Ann' }, schemas, ValidationContext.Input, 'application/json');

      // Assert
      assertRight(actual);
    });
  });
});

describe('findContentByMediaTypeOrFirst()', () => {
  describe('when a spec has a content type', () => {
    const content: IMediaTypeContent = {
      id: faker.random.word(),
      mediaType: 'application/x-www-form-urlencoded',
    };

    describe('and I request for the content type with the charset', () => {
      const foundContent = findContentByMediaTypeOrFirst([content], 'application/x-www-form-urlencoded; charset=UTF-8');

      it('should return the generic content', () => assertSome(foundContent));
    });
  });
});

describe('decodeUriEntities', () => {
  it('should decode both key and value', () => {
    const target = { 'profile%2DImage': 'outer%20space' };
    const results = decodeUriEntities(target, 'application/x-www-form-urlencoded');
    expect(results).toEqual({ 'profile-Image': 'outer space' });
  });

  it('should decode the key but leave the value as encoded if decoding fails', () => {
    const target = {
      'profile%2DImage':
        '�PNG\r\n\u001a\n\u0000\u0000\u0000\rIHDR\u0000\u0000\u0000\u0001\u0000\u0000\u0000\u0001\u0001\u0003\u0000\u0000\u0000%�V�\u0000\u0000\u0000\u0003PLTE\u0000\u0000\u0000�z=�\u0000\u0000\u0000\u0001tRNS\u0000@��f\u0000\u0000\u0000\nIDAT\b�c`\u0000\u0000\u0000\u0002\u0000\u0001�!�3\u0000\u0000\u0000\u0000IEND�B`�',
    };
    const results = decodeUriEntities(target, 'application/x-www-form-urlencoded');
    expect(results).toEqual({ 'profile-Image': target['profile%2DImage'] });
  });
});
