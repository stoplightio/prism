import { HttpParamStyles } from '@stoplight/types';

import { DelimitedStyleDeserializer } from '../delimited';

describe('DelimitedStyleDeserializer', () => {
  const delimitedStyleDeserializer = new DelimitedStyleDeserializer('|', HttpParamStyles.PipeDelimited);

  describe('supports()', () => {
    describe('style is supported', () => {
      it('returns true', () => {
        expect(delimitedStyleDeserializer.supports(HttpParamStyles.PipeDelimited)).toBe(true);
      });
    });
  });

  describe('deserialize()', () => {
    describe('schema type is not array', () => {
      it('throws exception', () => {
        expect(() =>
          delimitedStyleDeserializer.deserialize('key', {}, { type: 'string' }, false)
        ).toThrowErrorMatchingSnapshot();
      });
    });

    describe('schema type is array', () => {
      describe('explode is set', () => {
        describe('query param is an array', () => {
          it('returns unmodified query param', () => {
            expect(delimitedStyleDeserializer.deserialize('key', { key: ['a'] }, { type: 'array' }, true)).toEqual([
              'a',
            ]);
          });
        });

        describe('query param is a string', () => {
          it('returns value converted to array', () => {
            expect(delimitedStyleDeserializer.deserialize('key', { key: 'a' }, { type: 'array' }, true)).toEqual(['a']);
          });
        });
      });

      describe('explode is not set', () => {
        describe('query param is an array', () => {
          it('splits last query param array element', () => {
            expect(
              delimitedStyleDeserializer.deserialize('key', { key: ['a|b|c', 'd|e|f'] }, { type: 'array' }, false)
            ).toEqual(['d', 'e', 'f']);
          });
        });

        describe('query param is a string', () => {
          it('splits query param value', () => {
            expect(delimitedStyleDeserializer.deserialize('key', { key: 'a|b|c' }, { type: 'array' }, false)).toEqual([
              'a',
              'b',
              'c',
            ]);
          });
        });
      });
    });
  });
});
