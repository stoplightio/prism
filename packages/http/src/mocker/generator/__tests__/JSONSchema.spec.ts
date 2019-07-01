import { get } from 'lodash';
import { JSONSchema } from '../../../types';
import { generate } from '../JSONSchema';

describe('JSONSchema generator', () => {
  describe('generate()', () => {
    it('generates dynamic example from schema', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          ip: { type: 'string', 'x-faker': 'internet.ip' },
        },
        required: ['name', 'email', 'ip'],
      };

      const instance = generate(schema);
      expect(instance).toHaveProperty('name');
      expect(instance).toHaveProperty('email');
    });

    it('generates dynamic example with faker from schema', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          ip: { type: 'string', 'x-faker': 'internet.ip' },
        },
        required: ['name', 'email', 'ip'],
      };

      const instance = generate(schema);
      expect(instance).toHaveProperty('name');
      expect(instance).toHaveProperty('email');

      expect(instance).toHaveProperty('ip');
      const ipValue = get(instance, 'ip');

      const ipRegEx = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      expect(ipValue).not.toBe('internet.ip');
      expect(ipRegEx.test(ipValue)).toBeTruthy();
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
