import { validateSecurity } from '../security';

describe('validateSecurity', () => {
  describe('when no security schemes are defined in a spec', () => {
    it('passes the validation', () => {
      expect(validateSecurity<any, any>({}, { security: [[]] })).toStrictEqual([]);
    });
  });

  describe('when given an unknown security scheme type', () => {
    it('fails with a message explaining the issue', () => {
      expect(validateSecurity<any, any>({}, { security: [[{}]] })).toStrictEqual([
        {
          message: 'We currently do not support this type of security scheme.',
        },
      ]);
    });
  });

  describe('basic auth', () => {
    describe('when a proper Basic authorization token is provided in the header', () => {
      it('passes the validation', () => {
        const token = new Buffer('test:test').toString('base64');

        expect(
          validateSecurity<any, any>(
            { headers: { authorization: `Basic ${token}` } },
            { security: [[{ scheme: 'basic', type: 'http' }]] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('when given a token, that is not in <<user>>:<<pass>> base64-encoded format', () => {
      it('fails with an invalid credentials error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Basic abc123' } },
            { security: [[{ scheme: 'basic', type: 'http' }]] },
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

    describe('when authorization header contains an incorrect schema type', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [[{ scheme: 'basic', type: 'http' }]] },
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

  describe('digest auth', () => {
    describe('when all of the required parameters are provided in the header', () => {
      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' } },
            { security: [[{ scheme: 'digest', type: 'http' }]] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('when not all of the required parameters are provided in the header', () => {
      it('fails with an invalid credentials error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest username=""' } },
            { security: [[{ scheme: 'digest', type: 'http' }]] },
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

  describe('bearer token', () => {
    describe('when a bearer token is provided in authorization header', () => {
      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [[{ scheme: 'bearer', type: 'http' }]] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('when authorization header contains incorrect schema type', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [[{ scheme: 'bearer', type: 'http' }]] },
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

    describe('when authorization header is not provided', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>({ headers: {} }, { security: [[{ scheme: 'bearer', type: 'http' }]] }),
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
    describe('when a bearer token is provided', () => {
      it('it passes the validation', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [[{ type: 'oauth2' }]] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('when authorization header contains an incorrect schema type', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [[{ type: 'oauth2' }]] },
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
    describe('when a bearer token is provided', () => {
      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Bearer abc123' } },
            { security: [[{ type: 'openIdConnect' }]] },
          ),
        ).toStrictEqual([]);
      });
    });

    describe('when authorization header contains incorrect schema type', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { authorization: 'Digest abc123' } },
            { security: [[{ type: 'openIdConnect' }]] },
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

  describe('api key', () => {
    describe('when api key schema is used with another security scheme', () => {
      describe('when no auth credentials are presented', () => {
        it('does not add info to WWW-Authenticate header', () => {
          expect(
            validateSecurity<any, any>(
              { headers: {} },
              {
                security: [[{ scheme: 'basic', type: 'http' }, { in: 'header', type: 'apiKey', name: 'x-api-key' }]],
              },
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

    describe('when api key is expected to be found in a header', () => {
      describe('when the correct header is provided', () => {
        it('passes the validation', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { 'x-api-key': 'abc123' } },
              { security: [[{ in: 'header', type: 'apiKey', name: 'x-api-key' }]] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('when the required header is not provided', () => {
        it('fails with an invalid security scheme error', () => {
          expect(
            validateSecurity<any, any>(
              { headers: {} },
              { security: [[{ in: 'header', type: 'apiKey', name: 'x-api-key' }]] },
            ),
          ).toStrictEqual([
            {
              headers: {},
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });

    describe('when api key is expected to be found in the query', () => {
      describe('when the correct query is provided', () => {
        it('passes the validation', () => {
          expect(
            validateSecurity<any, any>(
              { url: { query: { key: 'abc123' } } },
              { security: [[{ in: 'query', type: 'apiKey', name: 'key' }]] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('when the correct query is not provided', () => {
        it('fails with an invalid security scheme error', () => {
          expect(
            validateSecurity<any, any>({}, { security: [[{ in: 'query', type: 'apiKey', name: 'key' }]] }),
          ).toStrictEqual([
            {
              headers: {},
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });

    describe('when api key is expected to be found in a cookie', () => {
      describe('when the correct cookie is provided', () => {
        it('passes the validation', () => {
          expect(
            validateSecurity<any, any>(
              { headers: { cookie: 'key=abc123' } },
              { security: [[{ in: 'cookie', type: 'apiKey', name: 'key' }]] },
            ),
          ).toStrictEqual([]);
        });
      });

      describe('when the required cookie is not provided', () => {
        it('fails with an invalid security scheme error', () => {
          expect(
            validateSecurity<any, any>({}, { security: [[{ in: 'cookie', type: 'apiKey', name: 'key' }]] }),
          ).toStrictEqual([
            {
              headers: {},
              message: 'Invalid security scheme used',
              name: 'Unauthorised',
              status: 401,
            },
          ]);
        });
      });
    });
  });

  describe('AND relation between security schemes', () => {
    const securityScheme = [
      [
        {
          in: 'header',
          type: 'apiKey',
          name: 'x-api-key',
        },
        {
          in: 'query',
          type: 'apiKey',
          name: 'apiKey',
        },
      ],
    ];

    describe('when security scheme expects two key', () => {
      it('fails with an invalid security scheme error', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { 'x-api-key': 'abc123' } },
            {
              security: securityScheme,
            },
          ),
        ).toStrictEqual([
          {
            headers: {},
            message: 'Invalid security scheme used',
            name: 'Unauthorised',
            status: 401,
          },
        ]);
      });

      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>(
            { headers: { 'x-api-key': 'abc123' }, url: { query: { apiKey: 'abc123' } } },
            {
              security: securityScheme,
            },
          ),
        ).toStrictEqual([]);
      });
    });
  });
});
