import { HttpParamStyles } from '@stoplight/types';

import { DeepObjectStyleDeserializer } from '../deepObject';

describe('DeepObjectStyleDeserializer', () => {
  const deepObjectStyleDeserializer = new DeepObjectStyleDeserializer();

  describe('supports()', () => {
    describe('style is supported', () => {
      it('returns true', () => {
        expect(deepObjectStyleDeserializer.supports(HttpParamStyles.DeepObject)).toBe(true);
      });
    });

    describe('style is not supported', () => {
      it('returns false', () => {
        expect(deepObjectStyleDeserializer.supports(HttpParamStyles.PipeDelimited)).toBe(false);
      });
    });
  });

  describe('deserialize()', () => {
    describe('schema type is an object', () => {
      it('converts params to object properly', () => {
        expect(
          deepObjectStyleDeserializer.deserialize(
            'key',
            {
              'key[a]': 'str',
              'key[b][ba]': 'str',
              'key[b][bc][0]': 'bc0',
              'key[b][bc][1]': 'bc1',
              'key[c][0][a]': 'c0a',
              'key[c][0][b]': 'c0b',
              'key[c][1][a]': 'c0a',
              'key[c][1][b]': 'c0b',
              other: 'other',
            },
            {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: {
                  type: 'object',
                  properties: {
                    ba: { type: 'string' },
                    bb: { type: 'object' },
                    bc: { type: 'array' },
                  },
                },
                c: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      a: { type: 'string' },
                      b: { type: 'string' },
                    },
                  },
                },
              },
            }
          )
        ).toEqual({
          a: 'str',
          b: { ba: 'str', bb: {}, bc: ['bc0', 'bc1'] },
          c: [
            { a: 'c0a', b: 'c0b' },
            { a: 'c0a', b: 'c0b' },
          ],
        });
      });

      describe('no properties are defined', () => {
        it('return empty object', () => {
          expect(deepObjectStyleDeserializer.deserialize('key', {}, { type: 'object' })).toEqual({});
        });
      });
    });
  });
});
