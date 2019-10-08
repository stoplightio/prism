import { DiagnosticSeverity } from '@stoplight/types';
import { Either, fold, isLeft, isRight, Left, left } from 'fp-ts/lib/Either';
import { none, Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, get, identity } from 'lodash';
import { noop, set } from 'lodash/fp';
import { IPrismDiagnostic } from '../../types';
import { securitySchemeHandlers } from './handlers';
import { SecurityScheme } from './handlers/types';

function gatherInvalidResults(
  error: Left<IPrismDiagnostic>,
  invalidSecuritySchemes: Array<Array<Either<IPrismDiagnostic, unknown>>>,
) {
  const invalidSecurity = gatherWWWAuthHeader(invalidSecuritySchemes, ['tags'], error.left);
  return some(invalidSecurity);
}

function gatherValidationResults(securitySchemes: SecurityScheme[][], someInput: unknown, resource: unknown) {
  const authResults = getAuthResults(securitySchemes, someInput, resource);

  const validSecurityScheme = authResults.find(authRes => authRes.every(isRight));
  const invalidSecuritySchemes = authResults.filter(authRes => authRes.some(isLeft));

  const firstLeft = invalidSecuritySchemes[0] && invalidSecuritySchemes[0].find(isLeft);

  if (!validSecurityScheme && firstLeft) {
    return gatherInvalidResults(firstLeft, invalidSecuritySchemes);
  } else {
    return none;
  }
}

function gatherWWWAuthHeader(
  authResults: Array<Array<Either<IPrismDiagnostic, unknown>>>,
  pathToHeader: string[],
  firstAuthErr: IPrismDiagnostic,
) {
  const flattenedAuthResults = flatten(authResults);

  if (flattenedAuthResults.length === 1) {
    return firstAuthErr;
  } else {
    const wwwAuthenticateHeaders = flattenedAuthResults.map(authResult =>
      pipe(
        authResult,
        fold(result => result.tags || [], noop),
      ),
    );

    const firstAuthErrWithAuthHeader = set(pathToHeader, flatten(wwwAuthenticateHeaders), firstAuthErr);

    return wwwAuthenticateHeaders.every(identity) ? firstAuthErrWithAuthHeader : firstAuthErr;
  }
}

function getAuthResult(
  firstAuthErrAsLeft: Left<IPrismDiagnostic>,
  authResult: Array<Either<IPrismDiagnostic, unknown>>,
) {
  const firstAuthErr: IPrismDiagnostic = pipe(
    firstAuthErrAsLeft,
    fold<IPrismDiagnostic, IPrismDiagnostic, IPrismDiagnostic>(identity, identity),
  );

  const invalidResultWithAuthHeader = gatherWWWAuthHeader([authResult], ['tags'], firstAuthErr);

  return [left(invalidResultWithAuthHeader)];
}

function getAuthResults(securitySchemes: SecurityScheme[][], someInput: unknown, resource: unknown) {
  return securitySchemes.map(securitySchemePairs => {
    const authResult = securitySchemePairs.map(securityScheme => {
      const schemeHandler = securitySchemeHandlers.find(handler => handler.test(securityScheme));

      return schemeHandler
        ? schemeHandler.handle(someInput, securityScheme.name, resource)
        : left({
            message: 'We currently do not support this type of security scheme.',
            severity: DiagnosticSeverity.Warning,
          });
    });

    const firstAuthErrAsLeft = authResult.find(isLeft);

    if (firstAuthErrAsLeft) {
      return getAuthResult(firstAuthErrAsLeft, authResult);
    } else {
      return authResult;
    }
  });
}

export function validateSecurity(someInput: unknown, resource?: unknown): Option<IPrismDiagnostic> {
  const securitySchemes = get(resource, 'security', []);

  if (!securitySchemes.length) {
    return none;
  } else {
    return gatherValidationResults(securitySchemes, someInput, resource);
  }
}
