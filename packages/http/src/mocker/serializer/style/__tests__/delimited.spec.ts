import { assertLeft, assertRight } from '../../../../__tests__/utils';
import {
  serializeWithCommaDelimitedStyle,
  serializeWithDelimitedStyle,
  serializeWithPipeDelimitedStyle,
  serializeWithSpaceDelimitedStyle,
} from '../delimited';

describe('serializeWithPipeDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithPipeDelimitedStyle('a', [1, 2, 3]), v => expect(v).toEqual('a=1|2|3'));
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithPipeDelimitedStyle('a', [1, 2, 3], true), v => expect(v).toEqual('a=1&a=2&a=3'));
    });
  });
});

describe('serializeWithSpaceDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithSpaceDelimitedStyle('a', [1, 2, 3]), v => expect(v).toEqual('a=1%202%203'));
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithSpaceDelimitedStyle('a', [1, 2, 3], true), v => expect(v).toEqual('a=1&a=2&a=3'));
    });
  });
});

describe('serializeWithCommaDelimitedStyle()', () => {
  describe('explode is not set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithCommaDelimitedStyle('a', [1, 2, 3]), v => expect(v).toEqual('a=1,2,3'));
    });
  });

  describe('explode is set', () => {
    it('serializes correctly', () => {
      assertRight(serializeWithCommaDelimitedStyle('a', [1, 2, 3], true), v => expect(v).toEqual('a=1&a=2&a=3'));
    });
  });
});

describe('serializeWithDelimitedStyle()', () => {
  describe('payload is not an array', () => {
    it('throws error', () => {
      assertLeft(serializeWithDelimitedStyle('|', 'a', 'test' as any, true), e =>
        expect(e.message).toEqual('Space/pipe/comma delimited style is only applicable to array parameter'),
      );
    });
  });
});
