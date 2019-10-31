import { DiagnosticSeverity } from '@stoplight/types';
import { validateSecurity } from '../security';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/utils/__tests__/utils';

describe('validateSecurity', () => {
  const token = new Buffer('test:test').toString('base64');

  it('passes the validation', () => {
    assertRight(validateSecurity({}, { security: [[]] }));
  });

  it('fails with a message explaining the issue', () => {
    assertLeft(validateSecurity({}, { security: [[{}]] }), obj =>
      expect(obj).toStrictEqual([{
        message: 'We currently do not support this type of security scheme.',
        severity: DiagnosticSeverity.Warning,
      }]),
    );
  });

  describe('when security scheme uses Basic authorization', () => {
    const securityScheme = [[{ scheme: 'basic', type: 'http' }]];

    it('passes the validation', () => {
      assertRight(validateSecurity({ headers: { authorization: `Basic ${token}` } }, { security: securityScheme }));
    });

    it('fails with an invalid credentials error', () => {
      assertLeft(validateSecurity({ headers: { authorization: 'Basic abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          tags: ['Basic realm="*"'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });
  });

  describe('when security scheme uses Digest authorization', () => {
    const securityScheme = [[{ scheme: 'digest', type: 'http' }]];

    it('passes the validation', () => {
      assertRight(
        validateSecurity(
          { headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' } },
          { security: securityScheme },
        ),
      );
    });

    it('fails with an invalid credentials error', () => {
      assertLeft(
        validateSecurity({ headers: { authorization: 'Digest username=""' } }, { security: securityScheme }),
        res =>
          expect(res).toStrictEqual([{
            code: 401,
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }]),
      );
    });
  });

  describe('when security scheme uses Bearer authorization', () => {
    const securityScheme = [[{ scheme: 'bearer', type: 'http' }]];

    it('passes the validation', () => {
      assertRight(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          tags: ['Bearer'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(validateSecurity({ tags: [] }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          tags: ['Bearer'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });
  });

  describe('when security scheme uses OAuth2 authorization', () => {
    const securityScheme = [[{ type: 'oauth2' }]];

    it('it passes the validation', () => {
      assertRight(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          tags: ['OAuth2'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });
  });

  describe('when security scheme uses OpenID authorization', () => {
    const securityScheme = [[{ type: 'openIdConnect' }]];

    it('passes the validation', () => {
      assertRight(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual([{
          code: 401,
          tags: ['OpenID'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }]),
      );
    });
  });

  describe('when security scheme uses Api Key authorization', () => {
    describe('when api key schema is used with another security scheme', () => {
      it('does not add info to WWW-Authenticate header', () => {
        assertLeft(
          validateSecurity(
            { headers: {} },
            {
              security: [[{ scheme: 'basic', type: 'http' }, { in: 'header', type: 'apiKey', name: 'x-api-key' }]],
            },
          ),
          res =>
            expect(res).toStrictEqual([{
              code: 401,
              tags: ['Basic realm="*"'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            }]),
        );
      });
    });

    describe('when api key is expected to be found in a header', () => {
      const securityScheme = [[{ in: 'header', type: 'apiKey', name: 'x-api-key' }]];

      it('passes the validation', () => {
        assertRight(validateSecurity({ headers: { 'x-api-key': 'abc123' } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(validateSecurity({ headers: {} }, { security: securityScheme }), res =>
          expect(res).toStrictEqual([{
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }]),
        );
      });
    });

    describe('when api key is expected to be found in the query', () => {
      const securityScheme = [[{ in: 'query', type: 'apiKey', name: 'key' }]];

      it('passes the validation', () => {
        assertRight(validateSecurity({ url: { query: { key: 'abc123' } } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(validateSecurity({}, { security: securityScheme }), res =>
          expect(res).toStrictEqual([{
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }]),
        );
      });
    });

    describe('when api key is expected to be found in a cookie', () => {
      const securityScheme = [[{ in: 'cookie', type: 'apiKey', name: 'key' }]];

      it('passes the validation', () => {
        assertRight(validateSecurity({ headers: { cookie: 'key=abc123' } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(validateSecurity({}, { security: securityScheme }), res =>
          expect(res).toStrictEqual([{
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }]),
        );
      });
    });
  });

  describe('OR relation between security schemes', () => {
    const securityScheme = [[{ scheme: 'bearer', type: 'http' }], [{ scheme: 'basic', type: 'http' }]];

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity(
          {},
          {
            security: securityScheme,
          },
        ),
        res =>
          expect(res).toStrictEqual([{
            code: 401,
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
            tags: ['Bearer', 'Basic realm="*"'],
          }]),
      );
    });

    it('passes the validation', () => {
      assertRight(
        validateSecurity(
          { headers: { authorization: 'Bearer abc123' } },
          {
            security: securityScheme,
          },
        ),
      );
    });

    it('passes the validation', () => {
      assertRight(
        validateSecurity(
          { headers: { authorization: `Basic ${token}` } },
          {
            security: securityScheme,
          },
        ),
      );
    });
  });

  describe('AND relation between security schemes', () => {
    const headerScheme = {
      in: 'header',
      type: 'apiKey',
      name: 'x-api-key',
    };

    describe('when 2 different security schemes are expected', () => {
      describe('expecting oauth + apikey', () => {
        const securityScheme = [[headerScheme, { type: 'oauth2' }]];

        it('fails with an invalid security scheme error', () => {
          assertLeft(
            validateSecurity(
              { headers: { 'x-api-key': 'abc123' } },
              {
                security: securityScheme,
              },
            ),
            res =>
              expect(res).toStrictEqual([{
                code: 401,
                message: 'Invalid security scheme used',
                severity: DiagnosticSeverity.Error,
                tags: ['OAuth2']
              }])
          );
        });

        it('passes the validation', () => {
          assertRight(
            validateSecurity(
              { headers: { 'x-api-key': 'abc123', authorization: 'Bearer abc123' } },
              {
                security: securityScheme,
              },
            ),
          );
        });
      });

      describe('expecting openid + apikey', () => {
        const securityScheme = [[headerScheme, { type: 'openIdConnect' }]];

        it('fails with an invalid security scheme error', () => {
          assertLeft(
            validateSecurity(
              { headers: { 'x-api-key': 'abc123' } },
              {
                security: securityScheme,
              },
            ),
            res =>
              expect(res).toStrictEqual([{
                code: 401,
                message: 'Invalid security scheme used',
                severity: DiagnosticSeverity.Error,
                tags: ['OpenID'],
              }]),
          );
        });

        it('passes the validation', () => {
          assertRight(
            validateSecurity(
              { headers: { 'x-api-key': 'abc123', authorization: 'Bearer abc123' } },
              {
                security: securityScheme,
              },
            ),
          );
        });
      });
    });

    describe('when security scheme expects two keys', () => {
      const securityScheme = [
        [
          headerScheme,
          {
            in: 'query',
            type: 'apiKey',
            name: 'apiKey',
          },
        ],
      ];

      it('fails with an invalid security scheme error', () => {
        assertLeft(
          validateSecurity(
            { headers: { 'x-api-key': 'abc123' } },
            {
              security: securityScheme,
            },
          ),
          res =>
            expect(res).toStrictEqual([{
              code: 401,
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
              tags: [],
            }]),
        );
      });

      it('passes the validation', () => {
        assertRight(
          validateSecurity(
            { headers: { 'x-api-key': 'abc123' }, url: { query: { apiKey: 'abc123' } } },
            {
              security: securityScheme,
            },
          ),
        );
      });
    });
  });
});
