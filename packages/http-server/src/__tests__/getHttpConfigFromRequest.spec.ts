import { getHttpConfigFromRequest } from '../getHttpConfigFromRequest';
import { assertRight } from '@stoplight/prism-core/src/__tests__/utils';

describe('getHttpConfigFromRequest()', () => {
  describe('given no default config', () => {
    test('and no query should return my own default', () => {
      return assertRight(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/' },
        }),
        parsed => expect(parsed).toEqual({})
      );
    });

    test('and no matching query should return my own default', () => {
      return assertRight(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: {} },
        }),
        parsed => expect(parsed).toEqual({})
      );
    });

    test('extracts code', () => {
      return assertRight(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __code: '202' } },
        }),
        parsed => expect(parsed).toHaveProperty('code', '202')
      );
    });

    test('extracts example', () => {
      return assertRight(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __example: 'bear' } },
        }),
        parsed => expect(parsed).toHaveProperty('exampleKey', 'bear')
      );
    });

    test('extracts dynamic', () => {
      return assertRight(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __dynamic: 'true' } },
        }),
        parsed => expect(parsed).toHaveProperty('dynamic', true)
      );
    });
  });
});
