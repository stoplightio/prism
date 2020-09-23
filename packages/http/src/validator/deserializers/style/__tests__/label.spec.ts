import { deserializeLabelStyle } from '../label';
import * as createObjectFromKeyValListModule from '../utils';

describe('deserialize()', () => {
  describe('value does not begin with a dot', () => {
    it('throws exception', () => {
      expect(() => deserializeLabelStyle('name', { name: 'bad' }, { type: 'string' })).toThrowError(
        'Label serialization style requires parameter to be prefixed with "."'
      );
    });
  });

  describe('type is a primitive', () => {
    it('returns unmodified value', () => {
      expect(deserializeLabelStyle('name', { name: '.value' }, { type: 'string' }, false)).toEqual('value');
    });
  });

  describe('type is an array', () => {
    describe('explode is not set', () => {
      describe('no value provided', () => {
        it('returns empty array', () => {
          expect(deserializeLabelStyle('name', { name: '.' }, { type: 'array' }, false)).toEqual([]);
        });
      });

      describe('comma separated list provided', () => {
        it('returns exploded array', () => {
          expect(deserializeLabelStyle('name', { name: '.a,b,c' }, { type: 'array' }, false)).toEqual(['a', 'b', 'c']);
        });
      });
    });

    describe('explode is set', () => {
      describe('no value provided', () => {
        it('returns empty array', () => {
          expect(deserializeLabelStyle('name', { name: '.' }, { type: 'array' }, true)).toEqual([]);
        });
      });

      describe('comma separated list provided', () => {
        it('returns exploded array', () => {
          expect(deserializeLabelStyle('name', { name: '.a.b.c' }, { type: 'array' }, true)).toEqual(['a', 'b', 'c']);
        });
      });
    });
  });

  describe('type is an object', () => {
    describe('explode is not set', () => {
      it('splits by comma and returns object', () => {
        jest.spyOn(createObjectFromKeyValListModule, 'createObjectFromKeyValList').mockImplementationOnce(list => {
          expect(list).toEqual(['a', 'b', 'c', 'd']);
          return { a: 'b', c: 'd' };
        });
        expect(deserializeLabelStyle('name', { name: '.a,b,c,d' }, { type: 'object' }, false)).toEqual({
          a: 'b',
          c: 'd',
        });
        expect(createObjectFromKeyValListModule.createObjectFromKeyValList).toHaveBeenCalled();
      });
    });

    describe('explode is set', () => {
      it('splits by comma and equality sign and returns object', () => {
        expect(deserializeLabelStyle('name', { name: '.a=b,c=d' }, { type: 'object' }, true)).toEqual({
          a: 'b',
          c: 'd',
        });
      });
    });
  });
});
