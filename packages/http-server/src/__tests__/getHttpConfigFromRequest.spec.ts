import { getHttpConfigFromRequest } from '../getHttpConfigFromRequest';

describe('getHttpConfigFromRequest()', () => {
  describe('given no default config', () => {
    test('and no query should return my own default', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/' },
        })
      ).toEqual({});
    });

    test('and no matching query should return my own default', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: {} },
        })
      ).toEqual({});
    });

    test('extracts code', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __code: '202' } },
        })
      ).toHaveProperty('code', '202');
    });

    test('extracts example', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __example: 'bear' } },
        })
      ).toHaveProperty('exampleKey', 'bear');
    });

    test('extracts dynamic', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __dynamic: 'true' } },
        })
      ).toHaveProperty('dynamic', true);
    });
  });
});
