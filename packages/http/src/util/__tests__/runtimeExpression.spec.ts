import { resolveRuntimeExpression } from '../runtimeExpression';
import { assertNone, assertSome } from '@stoplight/prism-core/src/utils/__tests__/utils';

describe('resolveRuntimeExpression', () => {
  it('resolves $method', () => {
    assertSome(
      resolveRuntimeExpression('$method', { method: 'get', url: { path: '' } }, { statusCode: 200 }),
       value => expect(value).toEqual('get'),
    );
  });

  it.skip('resolves $url', () => {
    assertSome(
      resolveRuntimeExpression('$url', { method: 'get', url: { path: '/path/to', query: { a: 'a' } } }, { statusCode: 200 }),
      value => expect(value).toEqual('/path/to?a=a'),
    );
  });

  it('resolves $statusCode', () => {
    assertSome(
      resolveRuntimeExpression('$statusCode', { method: 'get', url: { path: '' } }, { statusCode: 201 }),
       value => expect(value).toEqual('201'),
    );
  });

  it('returns none if expression is not recognized', () => {
    assertNone(resolveRuntimeExpression('$unsupported', { method: 'get', url: { path: '' } }, { statusCode: 200 }));
  });

  describe('$request.*', () => {
    it('resolves $request.query.*', () => {
      assertSome(
        resolveRuntimeExpression('$request.query.param', { method: 'get', url: { path: '', query: { param: 'test' } } }, { statusCode: 200 }),
        value => expect(value).toEqual('test'),
      );
    });

    it('resolves $request.header.*', () => {
      assertSome(
        resolveRuntimeExpression('$request.header.accept', { method: 'get', headers: { accept: 'oh/no' }, url: { path: '' } }, { statusCode: 200 }),
        value => expect(value).toEqual('oh/no'),
      );
    });

    it.todo('resolves $request.path.*');

    describe('$request.body', () => {
      it('resolves $request.body#*', () => {
        assertSome(
          resolveRuntimeExpression('$request.body#/inner/value', { method: 'get', body: { inner: { value: 'test' } }, url: { path: '' } }, { statusCode: 200 }),
          value => expect(value).toEqual('test'),
        );
      });

      it('resolves $request.body#* when body is not json', () => {
        assertNone(
          resolveRuntimeExpression('$request.body#/inner/value', { method: 'get', body: 'text body', url: { path: '' } }, { statusCode: 200 }),
        );
      });
    });

    it('returns none if request part is not recognized', () => {
      assertNone(resolveRuntimeExpression('$request.unsupported', { method: 'get', url: { path: '' } }, { statusCode: 200 }));
    });
  });

  describe('$response.*', () => {
    it('resolves $response.header.*', () => {
      assertSome(
        resolveRuntimeExpression('$response.header.forwarded', { method: 'get', url: { path: '' } }, { statusCode: 200, headers: { forwarded: 'by=prism' } }),
        value => expect(value).toEqual('by=prism'),
      );
    });

    it('resolves $response.body#*', () => {
      assertSome(
        resolveRuntimeExpression('$response.body#/inner/value', { method: 'get', url: { path: '' } }, { statusCode: 200, body: { inner: { value: 'test' } } }),
        value => expect(value).toEqual('test'),
      );
    });

    it('returns none if response part is not recognized', () => {
      assertNone(resolveRuntimeExpression('$response.unsupported', { method: 'get', url: { path: '' } }, { statusCode: 200 }));
    });
  });
});
