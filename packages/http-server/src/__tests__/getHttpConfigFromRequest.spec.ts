import { getHttpConfigFromRequest } from '../getHttpConfigFromRequest';

describe('getHttpConfigFromRequest()', () => {
  describe('given no default config', () => {
    test('and no query should return my own default', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/' },
        }),
      ).toMatchSnapshot();
    });
    test('and no matching query should return my own default', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: {} },
        }),
      ).toMatchSnapshot();
    });
    test('extracts code', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __code: '202' } },
        }),
      ).toMatchSnapshot();
    });
    test('extracts mediaType', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __contentType: 'application/json' } },
        }),
      ).toMatchSnapshot();
    });
    test('extracts example', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __example: 'bear' } },
        }),
      ).toMatchSnapshot();
    });
    test('extracts dynamic', () => {
      return expect(
        getHttpConfigFromRequest({
          method: 'get',
          url: { path: '/', query: { __dynamic: 'true' } },
        }),
      ).toMatchSnapshot();
    });
  });

  describe('given default config function', () => {
    test('and that function returns a mock should combine with query params', () => {
      const spy = jest.fn().mockReturnValue({
        mock: {
          exampleKey: 'key',
        },
      });
      return expect(
        getHttpConfigFromRequest(
          {
            method: 'get',
            url: { path: '/', query: { __code: '400' } },
          },
          spy,
        ),
      ).toMatchSnapshot();
    });
  });

  describe('given default config object', () => {
    test('that is boolean and no matching query params should return that config object', () => {
      return expect(
        getHttpConfigFromRequest(
          {
            method: 'get',
            url: { path: '/', query: {} },
          },
          { mock: false },
        ),
      ).toMatchSnapshot();
    });

    test('that is boolean and matching query should return that query', () => {
      return expect(
        getHttpConfigFromRequest(
          {
            method: 'get',
            url: { path: '/', query: { __code: '200', __example: 'bear' } },
          },
          { mock: false },
        ),
      ).toMatchSnapshot();
    });

    test('that is a map and matching query should return combined', () => {
      return expect(
        getHttpConfigFromRequest(
          {
            method: 'get',
            url: { path: '/', query: { __code: '200', __example: 'bear' } },
          },
          {
            mock: {
              exampleKey: 'wolf',
              mediaType: 'plain/text',
            },
          },
        ),
      ).toMatchSnapshot();
    });
  });
});
