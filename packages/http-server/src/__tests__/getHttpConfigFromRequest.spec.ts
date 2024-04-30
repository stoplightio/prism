import { getHttpConfigFromRequest } from '../getHttpConfigFromRequest';
import { assertLeft, assertRight } from '@stoplight/prism-core/src/__tests__/utils';

describe('getHttpConfigFromRequest()', () => {
  describe('given no default config', () => {
    describe('query', () => {
      test('and no query should return my own default', () => {
        return assertRight(
          getHttpConfigFromRequest({
            url: { path: '/' },
          }),
          parsed => expect(parsed).toEqual({})
        );
      });

      test('and no matching query should return my own default', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: {} } }), parsed =>
          expect(parsed).toEqual({})
        );
      });

      test('extracts code', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __code: '202' } } }), parsed =>
          expect(parsed).toHaveProperty('code', 202)
        );
      });

      test('validates code is a number', () => {
        return assertLeft(
          getHttpConfigFromRequest({
            url: { path: '/', query: { __code: 'default' } },
          }),
          error => expect(error.name).toEqual('UNPROCESSABLE_ENTITY')
        );
      });

      test('extracts example', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __example: 'bear' } } }), parsed =>
          expect(parsed).toHaveProperty('exampleKey', 'bear')
        );
      });

      test('extracts dynamic', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/', query: { __dynamic: 'true' } } }), parsed =>
          expect(parsed).toHaveProperty('dynamic', true)
        );
      });
    });

    describe('headers', () => {
      test('extracts code', () => {
        return assertRight(getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'code=202' } }), parsed =>
          expect(parsed).toHaveProperty('code', 202)
        );
      });

      test('validates code is a number', () => {
        return assertLeft(
          getHttpConfigFromRequest({
            url: { path: '/' },
            headers: { prefer: 'code=default' },
          }),
          error => expect(error.name).toEqual('UNPROCESSABLE_ENTITY')
        );
      });

      test('extracts example', () => {
        return assertRight(
          getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'example=bear' } }),
          parsed => expect(parsed).toHaveProperty('exampleKey', 'bear')
        );
      });

      test('extracts dynamic', () => {
        return assertRight(
          getHttpConfigFromRequest({ url: { path: '/' }, headers: { prefer: 'dynamic=true' } }),
          parsed => expect(parsed).toHaveProperty('dynamic', true)
        );
      });

      test('prefers header over query', () => {
        return assertRight(
          getHttpConfigFromRequest({
            url: { path: '/', query: { __dynamic: 'false' } },
            headers: { prefer: 'dynamic=true' },
          }),
          parsed => expect(parsed).toHaveProperty('dynamic', true)
        );
      });
    });
  });
});
