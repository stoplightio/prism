import { JSONSchema } from '../../types';
import { stripReadOnlyProperties, stripWriteOnlyProperties } from '../filterRequiredProperties';
import { assertSome } from '@stoplight/prism-core/src/__tests__/utils';

describe('filterRequiredProperties', () => {
  it('strips writeOnly properties', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string', writeOnly: true },
        title: { type: 'string', readOnly: true },
      },
      required: ['name', 'description', 'title'],
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.required).toEqual(['name', 'title']);
      expect(schema.properties).toEqual({
        name: expect.any(Object),
        title: expect.any(Object),
      });
    });
  });

  it('strips readOnly properties on standalone object', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string', writeOnly: true },
        title: { type: 'string', readOnly: true },
      },
      required: ['name', 'description', 'title'],
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.required).toEqual(['name', 'description']);
      expect(schema.properties).toEqual({
        name: expect.any(Object),
        description: expect.any(Object),
      });
    });
  });

  it('strips readOnly properties from objects within an array', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArray: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                readOnly: true,
                type: 'string'
              },
              name: {
                type: 'string'
              }
            }
          }
        }
      }
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr_items = (schema.properties.objectsArray as JSONSchema).items as JSONSchema
        expect(arr_items).not.toBeNull()
        if (arr_items){
          expect(arr_items.required).toEqual(['name']);
          expect(arr_items.properties).toEqual({
            name: expect.any(Object),
          });
        }
      }
    });
  });

  it('strips nested writeOnly properties', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        title: { type: 'string', readOnly: true },
        author: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string', writeOnly: true },
          },
          required: ['userId', 'username'],
        },
      },
      required: ['name', 'title', 'author'],
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.required).toEqual(['name', 'title', 'author']);
      expect(schema.properties).toEqual({
        name: expect.any(Object),
        title: expect.any(Object),
        author: expect.objectContaining({
          properties: {
            userId: {
              type: 'string',
            },
          },
          required: ['userId'],
        }),
      });
    });
  });

  it('strips writeOnly properties and leaves boolean properties', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: true,
        description: { type: 'string', writeOnly: true },
        title: { type: 'string', readOnly: true },
      },
      required: ['name', 'description', 'title'],
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.required).toEqual(['name', 'title']);
      expect(schema.properties).toEqual({
        name: true,
        title: { type: 'string', readOnly: true },
      });
    });
  });

  it('removes required properties that have been filtered', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string', writeOnly: true },
        priority: { type: 'number', default: 0 },
      },
      required: ['title', 'description'],
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.required).toEqual(['title']);
      expect(schema.properties).toEqual({
        title: { type: 'string' },
        priority: { type: 'number', default: 0 },
      });
    });
  });
});
