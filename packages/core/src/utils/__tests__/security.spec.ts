import { validateSecurity } from '../security';

describe('validateSecurity', () => {
  test('returns an empty array when no security schemes are defined in a spec', () => {
    expect(validateSecurity<any, any>({}, { security: [] })).toStrictEqual([]);
  });

  describe('when given an unknown security type', () => {
    test('returns a message explaining the issue', () => {
      expect(validateSecurity<any, any>({}, { security: [{}] })).toStrictEqual([
        {
          message: 'No handler for the security scheme found.',
        },
      ]);
    });
  });

  describe('basic auth', () => {
    describe('valid', () => {
      test('passes when the correct header is provided', () => {
        const token = new Buffer('test:test').toString('base64');

        expect(
          validateSecurity<any, any>(
            { headers: { authorization: `Basic ${token}` } },
            { security: [{ scheme: 'basic', type: 'http' }] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('invalid token, not in user:pass base64 form', () => {
      test('returns an error object with 403 code', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Basic abc123' } },
            { security: [{ scheme: 'basic', type: 'http' }] },
          ),
        ).toStrictEqual([
          {
            headers: {},
            message: 'Invalid credentials used',
            name: 'Forbidden',
            status: 403,
          },
        ]);
      });
    });

    describe('digest auth', () => {
      describe('valid', () => {
        test('passes when all of the required parameters are provided', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' } },
              { security: [{ scheme: 'digest', type: 'http' }] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('invalid', () => {
        test('fails when not all of the required parameters are passed', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { authorization: 'Digest username=""' } },
              { security: [{ scheme: 'digest', type: 'http' }] },
            ),
          ).toStrictEqual([
            {
              headers: {},
              message: 'Invalid credentials used',
              name: 'Forbidden',
              status: 403,
            },
          ]);
        });
      });
    });

    describe('incorrect scheme type', () => {
      test('return an error object with 401 code', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [{ scheme: 'basic', type: 'http' }] },
          ),
        ).toStrictEqual([
          {
            headers: {
              'WWW-Authenticate': 'Basic realm="*"',
            },
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });
    });
  });

  describe('Bearer token', () => {
    describe('valid', () => {
      test('passes when a bearer token is provided', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [{ scheme: 'bearer', type: 'http' }] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('invalid', () => {
      test('returns an error object with 401 code', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [{ scheme: 'bearer', type: 'http' }] },
          ),
        ).toStrictEqual([
          {
            headers: {
              'WWW-Authenticate': 'Bearer',
            },
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });
    });

    describe('invalid - no authorization header', () => {
      test('returns an error object with 401 code', () => {
        expect(
          validateSecurity<any, any>({ headers: {} }, { security: [{ scheme: 'bearer', type: 'http' }] }),
        ).toStrictEqual([
          {
            headers: {
              'WWW-Authenticate': 'Bearer',
            },
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });
    });
  });

  describe('oauth2', () => {
    describe('valid', () => {
      test('passes when a bearer token is provided', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [{ type: 'oauth2' }] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('invalid', () => {
      test('returns an error object with 401 code', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [{ type: 'oauth2' }] },
          ),
        ).toStrictEqual([
          {
            headers: {
              'WWW-Authenticate': 'OAuth2',
            },
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });
    });
  });

  describe('openid', () => {
    describe('valid', () => {
      test('passes when a bearer token is provided', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [{ type: 'openIdConnect' }] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('invalid', () => {
      test('returns an error object with 401 code', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [{ type: 'openIdConnect' }] },
          ),
        ).toStrictEqual([
          {
            headers: {
              'WWW-Authenticate': 'OpenID',
            },
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });
    });
  });

  describe('API KEY', () => {
    describe('in header', () => {
      describe('valid', () => {
        test('passes when the correct header is provided', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { 'x-api-key': 'abc123' } },
              { security: [{ in: 'header', type: 'apiKey', name: 'x-api-key' }] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('invalid', () => {
        test('returns an error object with 401 code', () => {
          expect(
            validateSecurity<any, any>(
              { headers: {} },
              { security: [{ in: 'header', type: 'apiKey', name: 'x-api-key' }] },
            ),
          ).toStrictEqual([
            {
              headers: {
                'WWW-Authenticate': 'x-api-key',
              },
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });

    describe('in query', () => {
      describe('valid', () => {
        test('passes when the correct query is provided', () => {
          expect(
            validateSecurity<any, any>(
              { url: { query: { key: 'abc123' } } },
              { security: [{ in: 'query', type: 'apiKey', name: 'key' }] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('invalid', () => {
        test('returns an error object with 401 code', () => {
          expect(
            validateSecurity<any, any>({}, { security: [{ in: 'query', type: 'apiKey', name: 'key' }] }),
          ).toStrictEqual([
            {
              headers: {
                'WWW-Authenticate': 'key',
              },
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });

    describe('in cookie', () => {
      describe('valid', () => {
        test('passes when the correct cookie is provided', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { cookie: 'key=abc123' } },
              { security: [{ in: 'cookie', type: 'apiKey', name: 'key' }] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('invalid', () => {
        test('returns an error object with 401 code', () => {
          expect(
            validateSecurity<any, any>({}, { security: [{ in: 'cookie', type: 'apiKey', name: 'key' }] }),
          ).toStrictEqual([
            {
              headers: {
                'WWW-Authenticate': 'Cookie realm="*" cookie-name=key',
              },
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });
  });
});
