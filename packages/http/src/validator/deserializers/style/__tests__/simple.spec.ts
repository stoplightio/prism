import { deserializeSimpleStyle } from '../simple';
import * as createObjectFromKeyValListModule from '../utils';

describe('deserialize()', () => {
  describe('type is a primitive', () => {
    it('returns unmodified value', () => {
      expect(deserializeSimpleStyle('name', { name: 'value' }, { type: 'string' }, false)).toEqual('value');
    });
  });

  describe('type is an array', () => {
    describe('value is empty', () => {
      it('returns empty array', () => {
        expect(deserializeSimpleStyle('name', { name: '' }, { type: 'array' }, false)).toEqual([]);
      });
    });

    describe('value is comma separated', () => {
      it('returns exploded array', () => {
        expect(deserializeSimpleStyle('name', { name: 'a,b,c' }, { type: 'array' }, false)).toEqual(['a', 'b', 'c']);
      });
    });
    it('returns unmodified value', () => {
      expect(deserializeSimpleStyle('name', { name: 'value' }, { type: 'string' }, false)).toEqual('value');
    });
  });

  describe('type is an object', () => {
    describe('explode is not set', () => {
      it('splits by comma and returns object', () => {
        jest.spyOn(createObjectFromKeyValListModule, 'createObjectFromKeyValList').mockImplementationOnce(list => {
          expect(list).toEqual(['a', 'b', 'c', 'd']);
          return { a: 'b', c: 'd' };
        });
        expect(deserializeSimpleStyle('name', { name: 'a,b,c,d' }, { type: 'object' }, false)).toEqual({
          a: 'b',
          c: 'd',
        });
        expect(createObjectFromKeyValListModule.createObjectFromKeyValList).toHaveBeenCalled();
      });
    });

    describe('explode is set', () => {
      it('splits by comma and equality sign and returns object', () => {
        expect(deserializeSimpleStyle('name', { name: 'a=b,c=d' }, { type: 'object' }, true)).toEqual({
          a: 'b',
          c: 'd',
        });
      });
    });
  });
});
