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

  it('strips readOnly properties on non-array object', () => {
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

  it('strips readOnly properties from objects in single schema array', () => {
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
        },
        title: { type: 'string', readOnly: true },
        address: { type: 'integer' },
      },
      required: ['title', 'address'],
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr_items = (schema.properties.objectsArray as JSONSchema).items as JSONSchema;

        expect(arr_items).not.toBeNull();
        expect(arr_items).not.toBeUndefined();

        if (arr_items) {
          expect(arr_items.required).toEqual(['name']);
          expect(arr_items.properties).toEqual({
            name: expect.any(Object),
          });
          expect(schema.required).toEqual(['address']);
          expect(schema.properties).toEqual({
            address: expect.any(Object),
            objectsArray: expect.any(Object),
          });
        }
      }
    });
  });

  it('strips writeOnly properties from objects in single schema array', () => {
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
                writeOnly: true,
                type: 'string'
              },
              name: {
                type: 'string'
              }
            }
          }
        },
        title: { type: 'string', writeOnly: true },
        address: { type: 'integer' },
      },
      required: ['title', 'address'],
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr_items = (schema.properties.objectsArray as JSONSchema).items as JSONSchema;

        expect(arr_items).not.toBeNull();
        expect(arr_items).not.toBeUndefined();

        if (arr_items) {
          expect(arr_items.required).toEqual(['name']);
          expect(arr_items.properties).toEqual({
            name: expect.any(Object),
          });
          expect(schema.required).toEqual(['address']);
          expect(schema.properties).toEqual({
            address: expect.any(Object),
            objectsArray: expect.any(Object),
          });
        }
      }
    });
  });

  it('strips readOnly properties from objects in tuple-typed array and unspecified additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayAdditionalItemsUnspecified: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { readOnly: true, type: 'string' }, 
                name: { type: 'string' } 
              } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { readOnly: true, type: 'string' }, 
                title: { type: 'string' } 
              } 
            }
          ]
        },
      }
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr_items = (schema.properties.objectsArrayAdditionalItemsUnspecified as JSONSchema).items;

        expect(arr_items).not.toBeNull();
        expect(arr_items).not.toBeUndefined();

        if (arr_items) {
          expect(arr_items[0].required).toEqual(['name']);
          expect(arr_items[0].properties).toEqual({
            name: expect.any(Object),
          });
          expect(arr_items[1].required).toEqual(['title']);
          expect(arr_items[1].properties).toEqual({
            title: expect.any(Object),
          });
        }
      }
    });
  });

  it('strips writeOnly properties from objects in tuple-typed array and unspecified additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayAdditionalItemsUnspecified: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { writeOnly: true, type: 'string' }, 
                name: { type: 'string' } 
              } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { writeOnly: true, type: 'string' }, 
                title: { type: 'string' } 
              } 
            }
          ]
        },
      }
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr_items = (schema.properties.objectsArrayAdditionalItemsUnspecified as JSONSchema).items;

        expect(arr_items).not.toBeNull();
        expect(arr_items).not.toBeUndefined();

        if (arr_items) {
          expect(arr_items[0].required).toEqual(['name']);
          expect(arr_items[0].properties).toEqual({
            name: expect.any(Object),
          });
          expect(arr_items[1].required).toEqual(['title']);
          expect(arr_items[1].properties).toEqual({
            title: expect.any(Object),
          });
        }
      }
    });
  });

  it('strips readOnly properties from objects in tuple-typed array with additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayWithAdditionalItems: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { readOnly: true, type: 'string' }, 
                name: { type: 'string' } 
              } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { readOnly: true, type: 'string' }, 
                title: { type: 'string' } 
              } 
            }
          ],
          additionalItems: {
            type: 'object',
            properties: {
              status: { readOnly: true, type: 'string' },
              ticket: { type: 'string' } 
            },
            required: ['status', 'ticket']
          }
        }
      }
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr = schema.properties.objectsArrayWithAdditionalItems as JSONSchema;
        
        expect(arr.items).not.toBeNull();
        expect(arr.items).not.toBeUndefined();

        const arr_items = arr.items as JSONSchema;
        expect(arr_items[0].required).toEqual(['name']);
        expect(arr_items[0].properties).toEqual({
          name: expect.any(Object)
        });
        expect(arr_items[1].required).toEqual(['title']);
        expect(arr_items[1].properties).toEqual({
          title: expect.any(Object)
        });

        expect(arr.additionalItems).not.toBeNull();
        const additional_items = arr.additionalItems as JSONSchema
        expect(additional_items.properties).toEqual({
          ticket: expect.any(Object)
        });
        expect(additional_items.required).toEqual(['ticket']);
      }
    });
  });

  it('strips writeOnly properties from objects in tuple-typed array with additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayWithAdditionalItems: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { writeOnly: true, type: 'string' }, 
                name: { type: 'string' } 
              } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { writeOnly: true, type: 'string' }, 
                title: { type: 'string' } 
              } 
            }
          ],
          additionalItems: {
            type: 'object',
            properties: {
              status: { writeOnly: true, type: 'string' },
              ticket: { type: 'string' } 
            },
            required: ['status', 'ticket']
          }
        }
      }
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr = schema.properties.objectsArrayWithAdditionalItems as JSONSchema;
        
        expect(arr.items).not.toBeNull();
        expect(arr.items).not.toBeUndefined();

        const arr_items = arr.items as JSONSchema;
        expect(arr_items[0].required).toEqual(['name']);
        expect(arr_items[0].properties).toEqual({
          name: expect.any(Object)
        });
        expect(arr_items[1].required).toEqual(['title']);
        expect(arr_items[1].properties).toEqual({
          title: expect.any(Object)
        });

        expect(arr.additionalItems).not.toBeNull();
        const additional_items = arr.additionalItems as JSONSchema
        expect(additional_items.properties).toEqual({
          ticket: expect.any(Object)
        });
        expect(additional_items.required).toEqual(['ticket']);
      }
    });
  });

  it('strips readOnly properties from objects in tuple-typed array no additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayNoAdditionalItems: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { readOnly: true, type: 'string' }, 
                name: { type: 'string' } 
              } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { readOnly: true, type: 'string' }, 
                title: { type: 'string' } 
              } 
            }
          ],
          additionalItems: false
        },
      }
    };

    assertSome(stripReadOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr = schema.properties.objectsArrayNoAdditionalItems as JSONSchema;
        
        expect(arr.items).not.toBeNull();
        expect(arr.items).not.toBeUndefined();

        const arr_items = arr.items as JSONSchema;
        expect(arr_items[0].required).toEqual(['name']);
        expect(arr_items[0].properties).toEqual({
          name: expect.any(Object)
        });
        expect(arr_items[1].required).toEqual(['title']);
        expect(arr_items[1].properties).toEqual({
          title: expect.any(Object)
        });

        expect(arr.additionalItems).toEqual(false);
      }
    });
  });

  it('strips writeOnly properties from objects in tuple-typed array no additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        objectsArrayNoAdditionalItems: {
          type: 'array',
          items: [
            { 
              type: 'object', 
              required: ['id', 'name'], 
              properties: { 
                id: { writeOnly: true, type: 'string' }, 
                name: { type: 'string' } } 
            },
            { 
              type: 'object', 
              required: ['address', 'title'], 
              properties: { 
                address: { writeOnly: true, type: 'string' }, 
                title: { type: 'string' } } 
            }
          ],
          additionalItems: false
        },
      }
    };

    assertSome(stripWriteOnlyProperties(schema), schema => {
      expect(schema.properties).not.toBeNull()
      if (schema.properties) {
        const arr = schema.properties.objectsArrayNoAdditionalItems as JSONSchema;
        
        expect(arr.items).not.toBeNull();
        expect(arr.items).not.toBeUndefined();

        const arr_items = arr.items as JSONSchema;
        expect(arr_items[0].required).toEqual(['name']);
        expect(arr_items[0].properties).toEqual({
          name: expect.any(Object)
        });
        expect(arr_items[1].required).toEqual(['title']);
        expect(arr_items[1].properties).toEqual({
          title: expect.any(Object)
        });

        expect(arr.additionalItems).toEqual(false);
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
