import { JSONSchemaValidator } from '../schema';

describe('JSONSchemaValidator', () => {
  const jsonSchemaValidator = new JSONSchemaValidator();

  describe('supports()', () => {
    describe('supported media type', () => {
      it('returns true', () => {
        expect(jsonSchemaValidator.supports('application/json')).toBe(true);
      });
    });

    describe('unsupported media type', () => {
      it('returns false', () => {
        expect(jsonSchemaValidator.supports('application/x')).toBe(false);
      });
    });
  });

  describe('validate()', () => {
    it('validates positively', () => {
      expect(jsonSchemaValidator.validate(JSON.parse('"str"'), { type: 'string' })).toEqual([]);
    });

    it('validates negatively', () => {
      expect(jsonSchemaValidator.validate(JSON.parse('{"key":"str"}'), { type: 'string' })).toMatchSnapshot();
    });
  });
});
