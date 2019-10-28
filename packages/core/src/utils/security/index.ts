import { DiagnosticSeverity } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, get, identity } from 'lodash';
import { noop, set } from 'lodash/fp';
import { IPrismDiagnostic } from '../../types';
import { securitySchemeHandlers } from './handlers';
import { SecurityScheme } from './handlers/types';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

function gatherInvalidResults(
  error: Either.Left<IPrismDiagnostic>,
  invalidSecuritySchemes: Array<Array<Either.Either<IPrismDiagnostic, unknown>>>
) {
  const invalidSecurity = gatherWWWAuthHeader(invalidSecuritySchemes, ['tags'], error.left);
  return Option.some(invalidSecurity);
}

function gatherValidationResults(securitySchemes: SecurityScheme[][], someInput: unknown, resource: unknown) {
  const authResults = getAuthResults(securitySchemes, someInput, resource);

  const validSecurityScheme = authResults.find(authRes => authRes.every(Either.isRight));
  const invalidSecuritySchemes = authResults.filter(authRes => authRes.some(Either.isLeft));

  const firstLeft = invalidSecuritySchemes[0] && invalidSecuritySchemes[0].find(Either.isLeft);

  if (!validSecurityScheme && firstLeft) {
    return gatherInvalidResults(firstLeft, invalidSecuritySchemes);
  } else {
    return Option.none;
  }
}

function gatherWWWAuthHeader(
  authResults: Array<Array<Either.Either<IPrismDiagnostic, unknown>>>,
  pathToHeader: string[],
  firstAuthErr: IPrismDiagnostic
) {
  const flattenedAuthResults = flatten(authResults);

  if (flattenedAuthResults.length === 1) {
    return firstAuthErr;
  } else {
    const wwwAuthenticateHeaders = flattenedAuthResults.map(authResult =>
      pipe(
        authResult,
        Either.fold(result => result.tags || [], noop)
      )
    );

    const firstAuthErrWithAuthHeader = set(pathToHeader, flatten(wwwAuthenticateHeaders), firstAuthErr);

    return wwwAuthenticateHeaders.every(identity) ? firstAuthErrWithAuthHeader : firstAuthErr;
  }
}

function getAuthResult(
  firstAuthErrAsLeft: Either.Left<IPrismDiagnostic>,
  authResult: Array<Either.Either<IPrismDiagnostic, unknown>>
) {
  const firstAuthErr: IPrismDiagnostic = pipe(
    firstAuthErrAsLeft,
    Either.fold<IPrismDiagnostic, IPrismDiagnostic, IPrismDiagnostic>(identity, identity)
  );

  const invalidResultWithAuthHeader = gatherWWWAuthHeader([authResult], ['tags'], firstAuthErr);

  return [Either.left(invalidResultWithAuthHeader)];
}

function getAuthResults(securitySchemes: SecurityScheme[][], someInput: unknown, resource: unknown) {
  return securitySchemes.map(securitySchemePairs => {
    const authResult = securitySchemePairs.map(securityScheme => {
      const schemeHandler = securitySchemeHandlers.find(handler => handler.test(securityScheme));

      return schemeHandler
        ? schemeHandler.handle(someInput, securityScheme.name, resource)
        : Either.left({
            message: 'We currently do not support this type of security scheme.',
            severity: DiagnosticSeverity.Warning,
          });
    });

    const firstAuthErrAsLeft = authResult.find(Either.isLeft);

    if (firstAuthErrAsLeft) {
      return getAuthResult(firstAuthErrAsLeft, authResult);
    } else {
      return authResult;
    }
  });
}

export function validateSecurity(
  someInput: unknown,
  resource?: unknown
): Either.Either<NonEmptyArray<IPrismDiagnostic>, unknown> {
  const securitySchemes = get(resource, 'security', []);

  if (!securitySchemes.length) {
    return Either.right(someInput);
  } else {
    return pipe(
      gatherValidationResults(securitySchemes, someInput, resource),
      Either.fromOption(() => someInput),
      Either.swap,
      Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
    );
  }
}
