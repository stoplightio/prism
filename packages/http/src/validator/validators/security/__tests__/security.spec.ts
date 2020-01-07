import { DiagnosticSeverity, HttpSecurityScheme } from '@stoplight/types';
import { validateSecurity } from '../';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { IHttpRequest } from '../../../../types';

const baseRequest: IHttpRequest = {
  method: 'get',
  url: { path: '/hey' },
};

describe('validateSecurity', () => {
  const token = new Buffer('test:test').toString('base64');

  it('passes the validation', () => {
    assertRight(validateSecurity({ element: baseRequest, resource: { security: [[]] } }));
  });

  describe('when security scheme uses Basic authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [[{ scheme: 'basic', type: 'http', key: 'sec' }]];

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: `Basic ${token}` } },
          resource: { security: securityScheme },
        })
      );
    });

    it('fails with an invalid credentials error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Basic abc123' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
              tags: [],
            },
          ])
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Bearer abc123' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: ['Basic realm="*"'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
      );
    });
  });

  describe('when security scheme uses Digest authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [[{ scheme: 'digest', type: 'http', key: 'sec' }]];

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: {
            ...baseRequest,
            headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' },
          },
          resource: { security: securityScheme },
        })
      );
    });

    it('fails with an invalid credentials error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Digest username=""' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
              tags: [],
            },
          ])
      );
    });
  });

  describe('when security scheme uses Bearer authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [[{ scheme: 'bearer', type: 'http', key: 'sec' }]];

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Bearer abc123' } },
          resource: { security: securityScheme },
        })
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Digest abc123' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: ['Bearer'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
      );
    });
  });

  describe('when security scheme uses OAuth2 authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [[{ type: 'oauth2', flows: {}, key: 'sec' }]];

    it('it passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Bearer abc123' } },
          resource: { security: securityScheme },
        })
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Digest abc123' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: ['OAuth2'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
      );
    });
  });

  describe('when security scheme uses OpenID authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [{ type: 'openIdConnect', openIdConnectUrl: 'https://google.it', key: 'sec' }],
    ];

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Bearer abc123' } },
          resource: { security: securityScheme },
        })
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Digest abc123' } },
          resource: { security: securityScheme },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: ['OpenID'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
      );
    });
  });

  describe('when security scheme uses Api Key authorization', () => {
    describe('when api key schema is used with another security scheme', () => {
      it('does not add info to WWW-Authenticate header', () => {
        assertLeft(
          validateSecurity({
            element: { ...baseRequest, headers: {} },
            resource: {
              security: [
                [
                  { scheme: 'basic', type: 'http', key: 'sec' },
                  { in: 'header', type: 'apiKey', name: 'x-api-key', key: 'sec' },
                ],
              ],
            },
          }),
          res =>
            expect(res).toStrictEqual([
              {
                code: 401,
                tags: ['Basic realm="*"'],
                message: 'Invalid security scheme used',
                severity: DiagnosticSeverity.Error,
              },
            ])
        );
      });
    });

    describe('when api key is expected to be found in a header', () => {
      const securityScheme: HttpSecurityScheme[][] = [
        [{ in: 'header', type: 'apiKey', name: 'x-api-key', key: 'sec' }],
      ];

      it('passes the validation', () => {
        assertRight(
          validateSecurity({
            element: { ...baseRequest, headers: { 'x-api-key': 'abc123' } },
            resource: { security: securityScheme },
          })
        );
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(
          validateSecurity({ element: { ...baseRequest, headers: {} }, resource: { security: securityScheme } }),
          res =>
            expect(res).toStrictEqual([
              {
                code: 401,
                tags: [],
                message: 'Invalid security scheme used',
                severity: DiagnosticSeverity.Error,
              },
            ])
        );
      });
    });

    describe('when api key is expected to be found in the query', () => {
      const securityScheme: HttpSecurityScheme[][] = [[{ in: 'query', type: 'apiKey', name: 'key', key: 'sec' }]];

      it('passes the validation', () => {
        assertRight(
          validateSecurity({
            element: { ...baseRequest, url: { path: '/', query: { key: 'abc123' } } },
            resource: { security: securityScheme },
          })
        );
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(validateSecurity({ element: baseRequest, resource: { security: securityScheme } }), res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: [],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
        );
      });
    });

    describe('when api key is expected to be found in a cookie', () => {
      const securityScheme: HttpSecurityScheme[][] = [[{ in: 'cookie', type: 'apiKey', name: 'key', key: 'sec' }]];

      it('passes the validation', () => {
        assertRight(
          validateSecurity({
            element: { ...baseRequest, headers: { cookie: 'key=abc123' } },
            resource: { security: securityScheme },
          })
        );
      });

      it('fails with an invalid security scheme error', () => {
        assertLeft(validateSecurity({ element: baseRequest, resource: { security: securityScheme } }), res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              tags: [],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
        );
      });
    });
  });

  describe('OR relation between security schemes', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [{ scheme: 'bearer', type: 'http', key: 'sec' }],
      [{ scheme: 'basic', type: 'http', key: 'sec' }],
    ];

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: baseRequest,
          resource: {
            security: securityScheme,
          },
        }),
        res =>
          expect(res).toStrictEqual([
            {
              code: 401,
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
              tags: ['Bearer', 'Basic realm="*"'],
            },
          ])
      );
    });

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Bearer abc123' } },
          resource: {
            security: securityScheme,
          },
        })
      );
    });

    it('passes the validation', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: `Basic ${token}` } },
          resource: {
            security: securityScheme,
          },
        })
      );
    });
  });

  describe('AND relation between security schemes', () => {
    const headerScheme = {
      in: 'header' as const,
      type: 'apiKey' as const,
      name: 'x-api-key' as const,
      key: 'sec' as const,
    };

    describe('when 2 different security schemes are expected', () => {
      describe('expecting oauth + apikey', () => {
        const securityScheme: HttpSecurityScheme[][] = [[headerScheme, { type: 'oauth2', flows: {}, key: 'sec' }]];

        it('fails with an invalid security scheme error', () => {
          assertLeft(
            validateSecurity({
              element: { ...baseRequest, headers: { 'x-api-key': 'abc123' } },
              resource: {
                security: securityScheme,
              },
            }),
            res =>
              expect(res).toStrictEqual([
                {
                  code: 401,
                  message: 'Invalid security scheme used',
                  severity: DiagnosticSeverity.Error,
                  tags: ['OAuth2'],
                },
              ])
          );
        });

        it('passes the validation', () => {
          assertRight(
            validateSecurity({
              element: { ...baseRequest, headers: { 'x-api-key': 'abc123', authorization: 'Bearer abc123' } },
              resource: {
                security: securityScheme,
              },
            })
          );
        });
      });

      describe('expecting openid + apikey', () => {
        const securityScheme: HttpSecurityScheme[][] = [
          [headerScheme, { type: 'openIdConnect', openIdConnectUrl: 'https://google.it', key: 'sec' }],
        ];

        it('fails with an invalid security scheme error', () => {
          assertLeft(
            validateSecurity({
              element: { ...baseRequest, headers: { 'x-api-key': 'abc123' } },
              resource: {
                security: securityScheme,
              },
            }),
            res =>
              expect(res).toStrictEqual([
                {
                  code: 401,
                  message: 'Invalid security scheme used',
                  severity: DiagnosticSeverity.Error,
                  tags: ['OpenID'],
                },
              ])
          );
        });

        it('passes the validation', () => {
          assertRight(
            validateSecurity({
              element: { ...baseRequest, headers: { 'x-api-key': 'abc123', authorization: 'Bearer abc123' } },
              resource: {
                security: securityScheme,
              },
            })
          );
        });
      });
    });

    describe('when security scheme expects two keys', () => {
      const securityScheme: HttpSecurityScheme[][] = [
        [
          headerScheme,
          {
            in: 'query',
            type: 'apiKey',
            name: 'apiKey',
            key: 'sec',
          },
        ],
      ];

      it('fails with an invalid security scheme error', () => {
        assertLeft(
          validateSecurity({
            element: { ...baseRequest, headers: { 'x-api-key': 'abc123' } },
            resource: {
              security: securityScheme,
            },
          }),
          res =>
            expect(res).toStrictEqual([
              {
                code: 401,
                message: 'Invalid security scheme used',
                severity: DiagnosticSeverity.Error,
                tags: [],
              },
            ])
        );
      });

      it('passes the validation', () => {
        assertRight(
          validateSecurity({
            element: {
              ...baseRequest,
              headers: { 'x-api-key': 'abc123' },
              url: { path: '/', query: { apiKey: 'abc123' } },
            },
            resource: {
              security: securityScheme,
            },
          })
        );
      });
    });
  });
});
