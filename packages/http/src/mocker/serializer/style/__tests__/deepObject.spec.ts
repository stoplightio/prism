import { assertRight } from '../../../../__tests__/utils';
import { serializeWithDeepObjectStyle } from '../deepObject';

describe('serializeWithDeepObjectStyle()', () => {
  it('handles primitive values', () => {
    assertRight(serializeWithDeepObjectStyle('a', 'b'), v => expect(v).toEqual('a=b'));
  });

  it('handles arrays', () => {
    assertRight(serializeWithDeepObjectStyle('a', ['x', 'y', 'z']), v => expect(v).toEqual('a[]=x&a[]=y&a[]=z'));
  });

  it('handles simple objects', () => {
    assertRight(serializeWithDeepObjectStyle('a', { aa: 1, ab: 2, ac: 3 }), v =>
      expect(v).toEqual('a[aa]=1&a[ab]=2&a[ac]=3'),
    );
  });

  it('handles nested objects', () => {
    assertRight(serializeWithDeepObjectStyle('a', { aa: { aaa: { aaaa: '1' } } }), v =>
      expect(v).toEqual('a[aa][aaa][aaaa]=1'),
    );
  });

  it('handles mixed objects and arrays', () => {
    assertRight(serializeWithDeepObjectStyle('a', { aa: { aaa: [{ aaaa: '1' }, { aaaa: '2' }] } }), v =>
      expect(v).toEqual('a[aa][aaa][][aaaa]=1&a[aa][aaa][][aaaa]=2'),
    );
  });
});
