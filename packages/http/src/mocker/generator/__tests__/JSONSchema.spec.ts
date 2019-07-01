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
  });
});
