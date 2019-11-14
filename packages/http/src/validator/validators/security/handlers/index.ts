import { apiKeyInCookie, apiKeyInHeader, apiKeyInQuery } from './apiKey';
import { httpBasic } from './basicAuth';
import { httpDigest } from './digestAuth';
import { bearer, oauth2, openIdConnect } from './bearer';
import { HttpSecurityScheme, DiagnosticSeverity } from '@stoplight/types';
import { ValidateSecurityFn } from './utils';
import { Either, right, fromNullable } from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '@stoplight/prism-core';

const securitySchemeHandlers: {
  openIdConnect: ValidateSecurityFn;
  oauth2: ValidateSecurityFn;
  apiKey: {
    cookie: ValidateSecurityFn;
    header: ValidateSecurityFn;
    query: ValidateSecurityFn;
  };
  http: {
    digest: ValidateSecurityFn;
    basic: ValidateSecurityFn;
    bearer: ValidateSecurityFn;
  };
} = {
  openIdConnect,
  oauth2,
  apiKey: {
    cookie: apiKeyInCookie,
    header: apiKeyInHeader,
    query: apiKeyInQuery,
  },
  http: {
    digest: httpDigest,
    basic: httpBasic,
    bearer,
  },
};

export function findSecurityHandler(scheme: HttpSecurityScheme): Either<IPrismDiagnostic, ValidateSecurityFn> {
  if (scheme.type === 'http') {
    return fromNullable<IPrismDiagnostic>({
      message: `We currently do not support this type of security scheme: http/${scheme.scheme}`,
      severity: DiagnosticSeverity.Warning,
    })(securitySchemeHandlers[scheme.type][scheme.scheme]);
  }
  if (scheme.type === 'apiKey') {
    return right(securitySchemeHandlers[scheme.type][scheme.in]);
  }
  return right(securitySchemeHandlers[scheme.type]);
}
