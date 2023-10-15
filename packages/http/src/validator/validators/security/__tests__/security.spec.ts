import { DiagnosticSeverity, HttpSecurityScheme } from '@stoplight/types';
import { validateSecurity } from '../';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import { IHttpRequest } from '../../../../types';
import * as faker from '@faker-js/faker/locale/en';

const baseRequest: IHttpRequest = {
  method: 'get',
  url: { path: '/hey' },
};

describe('validateSecurity', () => {
  const token = Buffer.from('test:test').toString('base64');

  it('passes the validation', () => {
    assertRight(validateSecurity({ element: baseRequest, resource: { security: [[]] } }));
  });

  describe('when security scheme uses Basic authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          scheme: 'basic',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
    ];

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
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          scheme: 'digest',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
    ];

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
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          scheme: 'bearer',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
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
              tags: ['Bearer'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            },
          ])
      );
    });
  });

  describe('when security scheme uses OAuth2 authorization', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          type: 'oauth2',
          flows: {},
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
    ];

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
      [
        {
          id: faker.random.word(),
          type: 'openIdConnect',
          openIdConnectUrl: 'https://google.it',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
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
                  {
                    id: faker.random.word(),
                    scheme: 'basic',
                    type: 'http',
                    key: 'sec',
                    extensions: { 'x-test': faker.random.word() },
                  },
                  {
                    id: faker.random.word(),
                    in: 'header',
                    type: 'apiKey',
                    name: 'x-api-key',
                    key: 'sec',
                    extensions: { 'x-test': faker.random.word() },
                  },
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
        [
          {
            id: faker.random.word(),
            in: 'header',
            type: 'apiKey',
            name: 'x-api-key',
            key: 'sec',
            extensions: { 'x-test': faker.random.word() },
          },
        ],
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
      const securityScheme: HttpSecurityScheme[][] = [
        [
          {
            id: faker.random.word(),
            in: 'query',
            type: 'apiKey',
            name: 'key',
            key: 'sec',
            extensions: { 'x-test': faker.random.word() },
          },
        ],
      ];

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
      const securityScheme: HttpSecurityScheme[][] = [
        [
          {
            id: faker.random.word(),
            in: 'cookie',
            type: 'apiKey',
            name: 'key',
            key: 'sec',
            extensions: { 'x-test': faker.random.word() },
          },
        ],
      ];

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

  describe('when security scheme is optional', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          scheme: 'bearer',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
      [], // yeah that's how you do optional in OpenAPI
    ];

    it('passes if no security scheme is used', () => {
      assertRight(
        validateSecurity({
          element: { ...baseRequest, headers: {} },
          resource: {
            security: securityScheme,
          },
        })
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

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: { ...baseRequest, headers: { authorization: 'Basic abc123' } },
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
              tags: ['Bearer', 'None'],
            },
          ])
      );
    });
  });

  describe('OR relation between security schemes', () => {
    const securityScheme: HttpSecurityScheme[][] = [
      [
        {
          id: faker.random.word(),
          scheme: 'bearer',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
      [
        {
          id: faker.random.word(),
          scheme: 'basic',
          type: 'http',
          key: 'sec',
          extensions: { 'x-test': faker.random.word() },
        },
      ],
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
      id: faker.random.word(),
      in: 'header' as const,
      type: 'apiKey' as const,
      name: 'x-api-key' as const,
      key: 'sec' as const,
      extensions: { 'x-test': 'test' },
    };

    describe('when 2 different security schemes are expected', () => {
      describe('expecting oauth + apikey', () => {
        const securityScheme: HttpSecurityScheme[][] = [
          [
            headerScheme,
            {
              id: faker.random.word(),
              type: 'oauth2',
              flows: {},
              key: 'sec',
              extensions: { 'x-test': faker.random.word() },
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
          [
            headerScheme,
            {
              id: faker.random.word(),
              type: 'openIdConnect',
              openIdConnectUrl: 'https://google.it',
              key: 'sec',
              extensions: { 'x-test': faker.random.word() },
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
            id: faker.random.word(),
            in: 'query',
            type: 'apiKey',
            name: 'apiKey',
            key: 'sec',
            extensions: { 'x-test': faker.random.word() },
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

  describe('Mix of AND and OR security schemes', () => {
    const headerScheme: HttpSecurityScheme = {
      id: faker.random.word(),
      in: 'header' as const,
      type: 'apiKey' as const,
      name: 'x-api-key' as const,
      key: 'sec' as const,
      extensions: { 'x-test': 'test' },
    };

    const queryScheme: HttpSecurityScheme = {
      id: faker.random.word(),
      in: 'query' as const,
      type: 'apiKey' as const,
      name: 'x-api-key' as const,
      key: 'sec' as const,
      extensions: { 'x-test': 'test' },
    };

    const cookieScheme: HttpSecurityScheme = {
      id: faker.random.word(),
      in: 'cookie' as const,
      type: 'apiKey' as const,
      name: 'x-api-key' as const,
      key: 'sec' as const,
      extensions: { 'x-test': 'test' },
    };

    const bearerScheme: HttpSecurityScheme = {
      id: faker.random.word(),
      scheme: 'bearer',
      type: 'http',
      key: 'sec',
      extensions: { 'x-test': faker.random.word() },
    };

    const oauth2Scheme: HttpSecurityScheme = {
      id: faker.random.word(),
      type: 'oauth2',
      flows: {},
      key: 'sec',
      extensions: { 'x-test': faker.random.word() },
    };

    const openIdScheme: HttpSecurityScheme = {
      id: faker.random.word(),
      type: 'openIdConnect',
      openIdConnectUrl: 'https://google.it',
      key: 'sec',
      extensions: { 'x-test': faker.random.word() },
    };

    const securityScheme: HttpSecurityScheme[][] = [
      // one of
      [
        // all of
        cookieScheme,
      ],
      [
        // all of
        queryScheme,
        oauth2Scheme,
      ],
      [
        // all of
        bearerScheme,
        headerScheme,
        openIdScheme,
      ],
    ];

    it('case 1 passes the validation', () => {
      assertRight(
        validateSecurity({
          element: {
            ...baseRequest,
            headers: { cookie: 'x-api-key=abc123' },
          },
          resource: {
            security: securityScheme,
          },
        })
      );
    });

    it('case 2 passes the validation', () => {
      assertRight(
        validateSecurity({
          element: {
            ...baseRequest,
            headers: { authorization: 'Bearer abc123' },
            url: { path: '/', query: { 'x-api-key': 'abc123' } },
          },
          resource: {
            security: securityScheme,
          },
        })
      );
    });

    it('case 3 passes the validation', () => {
      assertRight(
        validateSecurity({
          element: {
            ...baseRequest,
            headers: { 'x-api-key': 'abc123', authorization: 'Bearer abc123' },
            url: { path: '/', query: { 'x-api-key': 'abc123' } },
          },
          resource: {
            security: securityScheme,
          },
        })
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertLeft(
        validateSecurity({
          element: {
            ...baseRequest,
            headers: { 'x-api-key': 'abc123' },
            url: { path: '/', query: { 'x-api-key': 'abc123' } },
          },
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
              tags: ['OAuth2', 'Bearer', 'OpenID'],
            },
          ])
      );
    });
  });
});
