import { get } from 'lodash';
import { JSONSchema } from '../../../types';
import { generate, sortSchemaAlphabetically } from '../JSONSchema';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { IHttpOperation } from '@stoplight/types';

describe('JSONSchema generator', () => {
  const ipRegExp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  const emailRegExp =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const uuidRegExp = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;

  describe('generate()', () => {
    const operation = {} as IHttpOperation;

    describe('when used with a schema with a simple string property', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
        },
        required: ['name'],
      };

      it('will have a string property not matching anything in particular', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toHaveProperty('name');
          const name = get(instance, 'name', '');

          expect(ipRegExp.test(name)).toBeFalsy();
          expect(emailRegExp.test(name)).toBeFalsy();
        });
      });

      it('will have a deterministic dynamic response if the seed is set', async () => {
        const result1 = await generate(operation, {}, schema, 'test_seed')();
        const result2 = await generate(operation, {}, schema, 'test_seed')();

        assertRight(result1, instance1 => {
          assertRight(result2, instance2 => {
            expect(instance1).toEqual(instance2);
          });
        });
      });

      it('will generate a valid response when no seed is set', async () => {
        const result1 = await generate(operation, {}, schema)();

        assertRight(result1, instance1 => {
          expect(instance1).toHaveProperty('name');
          expect(typeof get(instance1, 'name')).toBe('string');
        });
      });
    });

    describe('when used with a schema with a string and email as format', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      };

      it('will have a string property matching the email regex', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toHaveProperty('email');
          const email = get(instance, 'email', '');

          expect(ipRegExp.test(email)).toBeFalsy();
          expect(emailRegExp.test(email)).toBeTruthy();
        });
      });
    });

    describe('when used with a schema with a string and uuid as format', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      };

      it('will have a string property matching uuid regex', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          const id = get(instance, 'id');
          expect(id).toMatch(uuidRegExp);
        });
      });

      it('will not be presented in the form of UUID as a URN', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          const id = get(instance, 'id', '');
          expect(id).not.toContain('urn:uuid');
        });
      });
    });

    describe('when used with a schema with a string property and x-faker property', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          ip: { type: 'string', format: 'ip', 'x-faker': 'internet.ipv4' },
        },
        required: ['ip'],
      };

      it('will have a string property matching the ip regex', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toHaveProperty('ip');
          const ip = get(instance, 'ip', '');

          expect(ipRegExp.test(ip)).toBeTruthy();
          expect(emailRegExp.test(ip)).toBeFalsy();
        });
      });
    });

    describe('when faker is configured per-property', () => {
      it('with named parameters', async () => {
        const schema: JSONSchema = {
          type: 'object',
          properties: {
            meaning: {
              type: 'number',
              'x-faker': 'number.int',
            },
          },
          required: ['meaning'],
        };

        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toHaveProperty('meaning');
          const actual = get(instance, 'meaning');
          expect(typeof actual).toBe('number');
        });
      });

      it('with positional parameters', async () => {
        const schema: JSONSchema = {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              'x-faker': {
                'helpers.slugify': ['two words'],
              },
            },
          },
          required: ['slug'],
        };

        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toHaveProperty('slug');
          const actual = get(instance, 'slug');
          expect(actual).toStrictEqual('two-words');
        });
      });
    });

    describe('when used with a schema that is not valid', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          _embedded: {
            $ref: '#/definitions/supermodelIoAdidasApiHAL',
          },
        },
      };

      it('will return a left', async () => {
        const result = await generate(operation, {}, schema)();
        assertLeft(result);
      });
    });

    describe('when writeOnly properties are provided', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', writeOnly: true },
        },
        required: ['id', 'title'],
        additionalProperties: false,
      };

      it('removes writeOnly properties', async () => {
        const result = await generate(operation, {}, schema)();
        assertRight(result, instance => {
          expect(instance).toEqual({
            id: expect.any(String),
          });
        });
      });
    });

    it('operates on sealed schema objects', async () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      Object.defineProperty(schema.properties, 'name', { writable: false });

      const result = await generate(operation, {}, schema)();
      expect(result).toBeTruthy();
    });
  });

  describe('sortSchemaAlphabetically()', () => {
    it('should handle nulls', () => {
      const source = null;
      expect(sortSchemaAlphabetically(source)).toEqual(null);
    });

    it('should leave source untouched if not array or object', () => {
      const source = 'string';

      expect(sortSchemaAlphabetically(source)).toEqual('string');
    });

    it('should leave source untouched if array of non-objects', () => {
      const source = ['string'];

      expect(sortSchemaAlphabetically(source)).toEqual(['string']);
    });

    it('should alphabetize properties of objects in array', () => {
      const source = ['string', { d: 'd value', a: 'a value', b: 'b value', c: 'c value' }];

      expect(sortSchemaAlphabetically(source)).toEqual([
        'string',
        { a: 'a value', b: 'b value', c: 'c value', d: 'd value' },
      ]);
    });

    it('should alphabetize properties of object', () => {
      const source = { d: 'd value', a: 'a value', b: 'b value', c: 'c value' };

      expect(sortSchemaAlphabetically(source)).toEqual({ a: 'a value', b: 'b value', c: 'c value', d: 'd value' });
    });

    it('should alphabetize properties of nested objects', () => {
      const source = {
        d: { d3: 'd3 value', d1: 'd1 value', d4: 'd4 value', d2: 'd2 value' },
        a: 'a value',
        b: { b2: 'b2 value', b1: 'b1 value', b3: 'b3 value' },
        c: 'c value',
      };

      expect(sortSchemaAlphabetically(source)).toEqual({
        a: 'a value',
        b: { b1: 'b1 value', b2: 'b2 value', b3: 'b3 value' },
        c: 'c value',
        d: { d1: 'd1 value', d2: 'd2 value', d3: 'd3 value', d4: 'd4 value' },
      });
    });
  });
});
