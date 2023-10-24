import { apiKeyInCookie, apiKeyInHeader, apiKeyInQuery } from './apiKey';
import { httpBasic } from './basicAuth';
import { httpDigest } from './digestAuth';
import { bearer, oauth2, openIdConnect } from './bearer';
import { none } from './none';
import { HttpSecurityScheme, DiagnosticSeverity } from '@stoplight/types';
import { ValidateSecurityFn } from './utils';
import { Either, fromNullable } from 'fp-ts/Either';
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
  none: ValidateSecurityFn;
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
  none,
};

function createDiagnosticFor(scheme: string): IPrismDiagnostic {
  return {
    message: `We currently do not support this type of security scheme: ${scheme}`,
    severity: DiagnosticSeverity.Warning,
  };
}

export function findSecurityHandler(scheme: HttpSecurityScheme): Either<IPrismDiagnostic, ValidateSecurityFn> {
  if (scheme.type === 'http') {
    return fromNullable(createDiagnosticFor(`http/${scheme.scheme}`))(
      securitySchemeHandlers[scheme.type][scheme.scheme]
    );
  }
  if (scheme.type === 'apiKey') {
    return fromNullable(createDiagnosticFor(`${scheme.type}/${scheme.in}`))(
      securitySchemeHandlers[scheme.type][scheme.in]
    );
  }
  return fromNullable(createDiagnosticFor(scheme.type))(securitySchemeHandlers[scheme.type]);
}

export { none as noneSecurityHandler };
