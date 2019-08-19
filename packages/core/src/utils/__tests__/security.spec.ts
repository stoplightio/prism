import { validateSecurity } from '../security';

describe('validateSecurity', () => {
  it('passes the validation', () => {
    expect(validateSecurity<any, any>({}, { security: [] })).toStrictEqual([]);
  });

  it('fails with a message explaining the issue', () => {
    expect(validateSecurity<any, any>({}, { security: [{}] })).toStrictEqual([
      {
        message: 'We currently do not support this type of security scheme.',
      },
    ]);
  });

  describe('when security scheme uses Basic authorization', () => {
    const securityScheme = [{ scheme: 'basic', type: 'http' }];

    it('passes the validation', () => {
      const token = new Buffer('test:test').toString('base64');

      expect(
        validateSecurity<any, any>({ headers: { authorization: `Basic ${token}` } }, { security: securityScheme }),
      ).toStrictEqual([]);
    });

    it('fails with an invalid credentials error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Basic abc123' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 403,
          headers: {},
          message: 'Invalid credentials used',
          severity: 0,
        },
      ]);
    });

    it('fails with an invalid security scheme error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="*"',
          },
          message: 'Invalid security scheme used',
          severity: 0,
        },
      ]);
    });
  });

  describe('when security scheme uses Digest authorization', () => {
    const securityScheme = [{ scheme: 'digest', type: 'http' }];

    it('passes the validation', () => {
      expect(
        validateSecurity<any, any>(
          { headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' } },
          { security: securityScheme },
        ),
      ).toStrictEqual([]);
    });

    it('fails with an invalid credentials error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Digest username=""' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 403,
          headers: {},
          message: 'Invalid credentials used',
          severity: 0,
        },
      ]);
    });
  });

  describe('when security scheme uses Bearer authorization', () => {
    const securityScheme = [{ scheme: 'bearer', type: 'http' }];

    it('passes the validation', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }),
      ).toStrictEqual([]);
    });

    it('fails with an invalid security scheme error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
          },
          message: 'Invalid security scheme used',
          severity: 0,
        },
      ]);
    });

    it('fails with an invalid security scheme error', () => {
      expect(validateSecurity<any, any>({ headers: {} }, { security: securityScheme })).toStrictEqual([
        {
          code: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
          },
          message: 'Invalid security scheme used',
          severity: 0,
        },
      ]);
    });
  });

  describe('when security scheme uses OAuth2 authorization', () => {
    const securityScheme = [{ type: 'oauth2' }];

    it('it passes the validation', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }),
      ).toStrictEqual([]);
    });

    it('fails with an invalid security scheme error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 401,
          headers: {
            'WWW-Authenticate': 'OAuth2',
          },
          message: 'Invalid security scheme used',
          severity: 0,
        },
      ]);
    });
  });

  describe('when security scheme uses OpenID authorization', () => {
    const securityScheme = [{ type: 'openIdConnect' }];

    it('passes the validation', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }),
      ).toStrictEqual([]);
    });

    it('fails with an invalid security scheme error', () => {
      expect(
        validateSecurity<any, any>({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }),
      ).toStrictEqual([
        {
          code: 401,
          headers: {
            'WWW-Authenticate': 'OpenID',
          },
          message: 'Invalid security scheme used',
          severity: 0,
        },
      ]);
    });
  });

  describe('when security scheme uses Api Key authorization', () => {
    describe('when api key schema is used with another security scheme', () => {
      it('does not add info to WWW-Authenticate header', () => {
        expect(
          validateSecurity<any, any>(
            { headers: {} },
            {
              security: [{ scheme: 'basic', type: 'http' }, { in: 'header', type: 'apiKey', name: 'x-api-key' }],
            },
          ),
        ).toStrictEqual([
          {
            code: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="*"',
            },
            message: 'Invalid security scheme used',
            severity: 0,
          },
        ]);
      });
    });

    describe('when api key is expected to be found in a header', () => {
      const securityScheme = [{ in: 'header', type: 'apiKey', name: 'x-api-key' }];

      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>({ headers: { 'x-api-key': 'abc123' } }, { security: securityScheme }),
        ).toStrictEqual([]);
      });

      it('fails with an invalid security scheme error', () => {
        expect(validateSecurity<any, any>({ headers: {} }, { security: securityScheme })).toStrictEqual([
          {
            code: 401,
            headers: {},
            message: 'Invalid security scheme used',
            severity: 0,
          },
        ]);
      });
    });

    describe('when api key is expected to be found in the query', () => {
      const securityScheme = [{ in: 'query', type: 'apiKey', name: 'key' }];

      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>({ url: { query: { key: 'abc123' } } }, { security: securityScheme }),
        ).toStrictEqual([]);
      });

      it('fails with an invalid security scheme error', () => {
        expect(validateSecurity<any, any>({}, { security: securityScheme })).toStrictEqual([
          {
            code: 401,
            headers: {},
            message: 'Invalid security scheme used',
            severity: 0,
          },
        ]);
      });
    });

    describe('when api key is expected to be found in a cookie', () => {
      const securityScheme = [{ in: 'cookie', type: 'apiKey', name: 'key' }];

      it('passes the validation', () => {
        expect(
          validateSecurity<any, any>({ headers: { cookie: 'key=abc123' } }, { security: securityScheme }),
        ).toStrictEqual([]);
      });

      it('fails with an invalid security scheme error', () => {
        expect(validateSecurity<any, any>({}, { security: securityScheme })).toStrictEqual([
          {
            code: 401,
            headers: {},
            message: 'Invalid security scheme used',
            severity: 0,
          },
        ]);
      });
    });
  });
});
