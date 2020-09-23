import { createDelimitedDeserializerStyle } from '../delimited';

const delimitedStyleDeserializer = createDelimitedDeserializerStyle('|');

describe('deserialize()', () => {
  describe('schema type is not array', () => {
    it('throws exception', () => {
      expect(() => delimitedStyleDeserializer('key', {}, { type: 'string' }, false)).toThrowError();
    });
  });

  describe('schema type is array', () => {
    describe('explode is set', () => {
      describe('query param is an array', () => {
        it('returns unmodified query param', () => {
          expect(delimitedStyleDeserializer('key', { key: ['a'] }, { type: 'array' }, true)).toEqual(['a']);
        });
      });

      describe('query param is a string', () => {
        it('returns value converted to array', () => {
          expect(delimitedStyleDeserializer('key', { key: 'a' }, { type: 'array' }, true)).toEqual(['a']);
        });
      });
    });

    describe('explode is not set', () => {
      describe('query param is an array', () => {
        it('splits last query param array element', () => {
          expect(delimitedStyleDeserializer('key', { key: ['a|b|c', 'd|e|f'] }, { type: 'array' }, false)).toEqual([
            'd',
            'e',
            'f',
          ]);
        });
      });

      describe('query param is a string', () => {
        it('splits query param value', () => {
          expect(delimitedStyleDeserializer('key', { key: 'a|b|c' }, { type: 'array' }, false)).toEqual([
            'a',
            'b',
            'c',
          ]);
        });
      });
    });
  });
});
