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

      it('will have a string property not matching anything in particular', () => {
        assertRight(generate(operation, {}, schema), instance => {
          expect(instance).toHaveProperty('name');
          const name = get(instance, 'name');

          expect(ipRegExp.test(name)).toBeFalsy();
          expect(emailRegExp.test(name)).toBeFalsy();
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

      it('will have a string property matching the email regex', () => {
        assertRight(generate(operation, {}, schema), instance => {
          expect(instance).toHaveProperty('email');
          const email = get(instance, 'email');

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

      it('will have a string property matching uuid regex', () => {
        assertRight(generate(operation, {}, schema), instance => {
          const id = get(instance, 'id');
          expect(id).toMatch(uuidRegExp);
        });
      });

      it('will not be presented in the form of UUID as a URN', () => {
        assertRight(generate(operation, {}, schema), instance => {
          const id = get(instance, 'id');
          expect(uuidRegExp.test(id)).not.toContainEqual('urn:uuid');
        });
      });
    });

    describe('when used with a schema with a string property and x-faker property', () => {
      const schema: JSONSchema & any = {
        type: 'object',
        properties: {
          ip: { type: 'string', format: 'ip', 'x-faker': 'internet.ip' },
        },
        required: ['ip'],
      };

      it('will have a string property matching the ip regex', () => {
        assertRight(generate(operation, {}, schema), instance => {
          expect(instance).toHaveProperty('ip');
          const ip = get(instance, 'ip');

          expect(ipRegExp.test(ip)).toBeTruthy();
          expect(emailRegExp.test(ip)).toBeFalsy();
        });
      });
    });

    describe('when faker is configured per-property', () => {
      it('with named parameters', () => {
        const schema: JSONSchema & any = {
          type: 'object',
          properties: {
            meaning: {
              type: 'number',
              'x-faker': {
                'random.number': {
                  min: 42,
                  max: 42,
                },
              },
            },
          },
          required: ['meaning'],
        };

        assertRight(generate(operation, {}, schema), instance => {
          expect(instance).toHaveProperty('meaning');
          const actual = get(instance, 'meaning');
          expect(actual).toStrictEqual(42);
        });
      });

      it('with positional parameters', () => {
        const schema: JSONSchema & any = {
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

        assertRight(generate(operation, {}, schema), instance => {
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

      it('will return a left', () => assertLeft(generate(operation, {}, schema)));
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

      it('removes writeOnly properties', () => {
        assertRight(generate(operation, {}, schema), instance => {
          expect(instance).toEqual({
            id: expect.any(String),
          });
        });
      });
    });

    it('operates on sealed schema objects', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      Object.defineProperty(schema.properties, 'name', { writable: false });

      return expect(generate(operation, {}, schema)).toBeTruthy();
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
