import { get } from 'lodash';
import { JSONSchema } from '../../../types';
import { generate } from '../JSONSchema';

describe('JSONSchema generator', () => {
  const ipRegExp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  describe('generate()', () => {
    describe('when used with a schema with a simple string property', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
        },
        required: ['name'],
      };

      it('will have a string property not matching anything in particular', () => {
        const instance = generate(schema);
        expect(instance).toHaveProperty('name');
        const name = get(instance, 'name');

        expect(ipRegExp.test(name)).toBeFalsy();
        expect(emailRegExp.test(name)).toBeFalsy();
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
        const instance = generate(schema);
        expect(instance).toHaveProperty('email');
        const email = get(instance, 'email');

        expect(ipRegExp.test(email)).toBeFalsy();
        expect(emailRegExp.test(email)).toBeTruthy();
      });
    });

    describe('when used with a schema with a string property and x-faker property', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          ip: { type: 'string', format: 'ip', 'x-faker': 'internet.ip' },
        },
        required: ['ip'],
      };

      it('will have a string property matching the ip regex', () => {
        const instance = generate(schema);
        expect(instance).toHaveProperty('ip');
        const ip = get(instance, 'ip');

        expect(ipRegExp.test(ip)).toBeTruthy();
        expect(emailRegExp.test(ip)).toBeFalsy();
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

      return expect(generate(schema)).toBeTruthy();
    });

    describe('multiple properties', () => {
      describe('no required properties specified', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            properties: {
              name: { type: 'string' },
              abc: { type: 'string' },
              xyz: { type: 'string' },
            },
          };

          const instance = generate(schema);

          expect(instance).toHaveProperty('name');
          expect(instance).toHaveProperty('abc');
          expect(instance).toHaveProperty('xyz');
        });
      });

      describe('with required properties specified', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            properties: {
              name: { type: 'string' },
              abc: { type: 'string' },
              xyz: { type: 'string' },
            },
            required: ['name', 'abc'],
          };

          const instance = generate(schema);

          expect(instance).toHaveProperty('name');
          expect(instance).toHaveProperty('abc');
          expect(instance).toHaveProperty('xyz');
        });
      });
    });

    describe('allOf', () => {
      describe('no required properties specified in any of the 2 allOfs', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            allOf: [
              {
                properties: {
                  name: {
                    type: 'string',
                  },
                },
              },
              {
                properties: {
                  color: {
                    type: 'string',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          expect(instance).toHaveProperty('name');
          expect(instance).toHaveProperty('color');
        });
      });

      describe('with required properties specified for the 2 of the 2 allOfs', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            allOf: [
              {
                required: ['name', 'length'],
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  length: {
                    type: 'integer',
                  },
                },
              },
              {
                required: ['color'],
                type: 'object',
                properties: {
                  color: {
                    type: 'string',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          expect(instance).toHaveProperty('name');
          expect(instance).toHaveProperty('length');
          expect(instance).toHaveProperty('color');
        });
      });

      describe('with required properties specified in 1 of the 2 allOfs', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            allOf: [
              {
                required: ['name', 'length'],
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  length: {
                    type: 'integer',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  color: {
                    type: 'string',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          expect(instance).toHaveProperty('name');
          expect(instance).toHaveProperty('length');
          expect(instance).toHaveProperty('color');
        });
      });
    });

    describe('oneOf', () => {
      describe('no required properties specified in any of the 2 oneOfs', () => {
        it('generates all of the properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            oneOf: [
              {
                type: 'object',
                properties: {
                  color: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  age: {
                    type: 'integer',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          try {
            expect(instance).toHaveProperty('color');
          } catch (e) {
            expect(instance).toHaveProperty('age');
          }
        });
      });

      describe('with required properties specified in 1 of the 2 oneOfs', () => {
        it('generates proper properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            oneOf: [
              {
                required: ['name'],
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  color: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                properties: {
                  age: {
                    type: 'integer',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          if ((instance as any).name) {
            expect(instance).toHaveProperty('color');
          } else {
            expect(instance).toHaveProperty('age');
          }
        });
      });

      describe('with required properties specified in the 2 of the 2 oneOfs', () => {
        it('generates proper properties', () => {
          const schema: JSONSchema = {
            type: 'object',
            oneOf: [
              {
                required: ['name'],
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  color: {
                    type: 'string',
                  },
                },
              },
              {
                required: ['age'],
                type: 'object',
                properties: {
                  age: {
                    type: 'integer',
                  },
                },
              },
            ],
          };

          const instance = generate(schema);

          if ((instance as any).name) {
            expect(instance).toHaveProperty('color');
          } else {
            expect(instance).toHaveProperty('age');
          }
        });
      });
    });
  });
});
