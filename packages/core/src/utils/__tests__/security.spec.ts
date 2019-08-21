import { DiagnosticSeverity } from '@stoplight/types';
import { validateSecurity } from '../security';
import { assertNone, assertSome } from './utils';

describe('validateSecurity', () => {
  it('passes the validation', () => {
    assertNone(validateSecurity({}, { security: [] }));
  });

  it('fails with a message explaining the issue', () => {
    assertSome(validateSecurity({}, { security: [{}] }), obj =>
      expect(obj).toStrictEqual(new Error('We currently do not support this type of security scheme.')),
    );
  });

  describe('when security scheme uses Basic authorization', () => {
    const securityScheme = [{ scheme: 'basic', type: 'http' }];

    it('passes the validation', () => {
      const token = new Buffer('test:test').toString('base64');

      assertNone(validateSecurity({ headers: { authorization: `Basic ${token}` } }, { security: securityScheme }));
    });

    it('fails with an invalid credentials error', () => {
      assertSome(validateSecurity({ headers: { authorization: 'Basic abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 403,
          message: 'Invalid credentials used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertSome(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 401,
          tags: ['Basic realm="*"'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });
  });

  describe('when security scheme uses Digest authorization', () => {
    const securityScheme = [{ scheme: 'digest', type: 'http' }];

    it('passes the validation', () => {
      assertNone(
        validateSecurity(
          { headers: { authorization: 'Digest username="", realm="", nonce="", uri="", response=""' } },
          { security: securityScheme },
        ),
      );
    });

    it('fails with an invalid credentials error', () => {
      assertSome(
        validateSecurity({ headers: { authorization: 'Digest username=""' } }, { security: securityScheme }),
        res =>
          expect(res).toStrictEqual({
            code: 403,
            message: 'Invalid credentials used',
            severity: DiagnosticSeverity.Error,
          }),
      );
    });
  });

  describe('when security scheme uses Bearer authorization', () => {
    const securityScheme = [{ scheme: 'bearer', type: 'http' }];

    it('passes the validation', () => {
      assertNone(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertSome(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 401,
          tags: ['Bearer'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });

    it('fails with an invalid security scheme error', () => {
      assertSome(validateSecurity({ tags: [] }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 401,
          tags: ['Bearer'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });
  });

  describe('when security scheme uses OAuth2 authorization', () => {
    const securityScheme = [{ type: 'oauth2' }];

    it('it passes the validation', () => {
      assertNone(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertSome(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 401,
          tags: ['OAuth2'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });
  });

  describe('when security scheme uses OpenID authorization', () => {
    const securityScheme = [{ type: 'openIdConnect' }];

    it('passes the validation', () => {
      assertNone(validateSecurity({ headers: { authorization: 'Bearer abc123' } }, { security: securityScheme }));
    });

    it('fails with an invalid security scheme error', () => {
      assertSome(validateSecurity({ headers: { authorization: 'Digest abc123' } }, { security: securityScheme }), res =>
        expect(res).toStrictEqual({
          code: 401,
          tags: ['OpenID'],
          message: 'Invalid security scheme used',
          severity: DiagnosticSeverity.Error,
        }),
      );
    });
  });

  describe('when security scheme uses Api Key authorization', () => {
    describe('when api key schema is used with another security scheme', () => {
      it('does not add info to WWW-Authenticate header', () => {
        assertSome(
          validateSecurity(
            { tags: [] },
            {
              security: [{ scheme: 'basic', type: 'http' }, { in: 'header', type: 'apiKey', name: 'x-api-key' }],
            },
          ),
          res =>
            expect(res).toStrictEqual({
              code: 401,
              tags: ['Basic realm="*"'],
              message: 'Invalid security scheme used',
              severity: DiagnosticSeverity.Error,
            }),
        );
      });
    });

    describe('when api key is expected to be found in a header', () => {
      const securityScheme = [{ in: 'header', type: 'apiKey', name: 'x-api-key' }];

      it('passes the validation', () => {
        assertNone(validateSecurity({ headers: { 'x-api-key': 'abc123' } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertSome(validateSecurity({ tags: [] }, { security: securityScheme }), res =>
          expect(res).toStrictEqual({
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }),
        );
      });
    });

    describe('when api key is expected to be found in the query', () => {
      const securityScheme = [{ in: 'query', type: 'apiKey', name: 'key' }];

      it('passes the validation', () => {
        assertNone(validateSecurity({ url: { query: { key: 'abc123' } } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertSome(validateSecurity({}, { security: securityScheme }), res =>
          expect(res).toStrictEqual({
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }),
        );
      });
    });

    describe('when api key is expected to be found in a cookie', () => {
      const securityScheme = [{ in: 'cookie', type: 'apiKey', name: 'key' }];

      it('passes the validation', () => {
        assertNone(validateSecurity({ headers: { cookie: 'key=abc123' } }, { security: securityScheme }));
      });

      it('fails with an invalid security scheme error', () => {
        assertSome(validateSecurity({}, { security: securityScheme }), res =>
          expect(res).toStrictEqual({
            code: 401,
            tags: [],
            message: 'Invalid security scheme used',
            severity: DiagnosticSeverity.Error,
          }),
        );
      });
    });
  });
});
