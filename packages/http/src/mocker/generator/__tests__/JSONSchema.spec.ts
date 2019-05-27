import { generate } from '../JSONSchema';

describe('JSONSchema generator', () => {
  describe('generate()', () => {
    it('generates dynamic example from schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
        },
        required: ['name', 'email'],
      };

      const instance = await generate(schema);
      expect(instance).toHaveProperty('name');
      expect(instance).toHaveProperty('email');
    });

    it('operates on sealed schema objects', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      Object.defineProperty(schema.properties, 'name', { writable: false });

      return expect(generate(schema)).resolves.toBeTruthy();
    });
  });
});
