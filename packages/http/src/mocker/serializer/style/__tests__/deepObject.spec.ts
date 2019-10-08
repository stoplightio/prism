import { serializeWithDeepObjectStyle } from '../deepObject';

describe('serializeWithDeepObjectStyle()', () => {
  it('handles primitive values', () => {
    expect(serializeWithDeepObjectStyle('a', 'b')).toEqual('a=b');
  });

  it('handles arrays', () => {
    expect(serializeWithDeepObjectStyle('a', ['x', 'y', 'z'])).toEqual('a[]=x&a[]=y&a[]=z');
  });

  it('handles simple objects', () => {
    expect(serializeWithDeepObjectStyle('a', { aa: 1, ab: 2, ac: 3 })).toEqual('a[aa]=1&a[ab]=2&a[ac]=3');
  });

  it('handles nested objects', () => {
    expect(serializeWithDeepObjectStyle('a', { aa: { aaa: { aaaa: '1' } } })).toEqual('a[aa][aaa][aaaa]=1');
  });

  it('handles mixed objects and arrays', () => {
    expect(serializeWithDeepObjectStyle('a', { aa: { aaa: [{ aaaa: '1' }, { aaaa: '2' }] } })).toEqual(
      'a[aa][aaa][][aaaa]=1&a[aa][aaa][][aaaa]=2',
    );
  });
});
