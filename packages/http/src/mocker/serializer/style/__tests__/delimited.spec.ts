import {
  serializeWithCommaDelimitedStyle,
  serializeWithPipeDelimitedStyle,
  serializeWithSpaceDelimitedStyle,
} from '../delimited';

describe('serializeWithPipeDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      expect(serializeWithPipeDelimitedStyle('a', [1, 2, 3])).toEqual('a=1|2|3');
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      expect(serializeWithPipeDelimitedStyle('a', [1, 2, 3], true)).toEqual('a=1&a=2&a=3');
    });
  });
});

describe('serializeWithSpaceDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      expect(serializeWithSpaceDelimitedStyle('a', [1, 2, 3])).toEqual('a=1 2 3');
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      expect(serializeWithSpaceDelimitedStyle('a', [1, 2, 3], true)).toEqual('a=1&a=2&a=3');
    });
  });
});

describe('serializeWithCommaDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      expect(serializeWithCommaDelimitedStyle('a', [1, 2, 3])).toEqual('a=1,2,3');
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      expect(serializeWithCommaDelimitedStyle('a', [1, 2, 3], true)).toEqual('a=1&a=2&a=3');
    });
  });
});
