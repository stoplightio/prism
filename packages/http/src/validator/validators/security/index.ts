import { IHttpOperation, HttpSecurityScheme } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, identity } from 'lodash';
import { noop, set } from 'lodash/fp';
import { findSecurityHandler } from './handlers';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';

function gatherInvalidResults(
  error: Either.Left<IPrismDiagnostic>,
  invalidSecuritySchemes: Array<Array<Either.Either<IPrismDiagnostic, unknown>>>
) {
  const invalidSecurity = gatherWWWAuthHeader(invalidSecuritySchemes, ['tags'], error.left);
  return Option.some(invalidSecurity);
}

function gatherValidationResults(
  securitySchemes: HttpSecurityScheme[][],
  input: Pick<IHttpRequest, 'headers' | 'url'>
) {
  const authResults = getAuthResults(securitySchemes, input);

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
  const firstAuthErr = pipe(
    firstAuthErrAsLeft,
    Either.fold<IPrismDiagnostic, IPrismDiagnostic, IPrismDiagnostic>(identity, identity)
  );

  const invalidResultWithAuthHeader = gatherWWWAuthHeader([authResult], ['tags'], firstAuthErr);

  return [Either.left(invalidResultWithAuthHeader)];
}

function getAuthResults(securitySchemes: HttpSecurityScheme[][], input: Pick<IHttpRequest, 'headers' | 'url'>) {
  return securitySchemes.map(securitySchemePairs => {
    const authResult = securitySchemePairs.map(securityScheme =>
      pipe(
        findSecurityHandler(securityScheme),
        Either.chain(f => f(input, 'name' in securityScheme ? securityScheme.name : ''))
      )
    );

    const firstAuthErrAsLeft = authResult.find(Either.isLeft);

    if (firstAuthErrAsLeft) {
      return getAuthResult(firstAuthErrAsLeft, authResult);
    } else {
      return authResult;
    }
  });
}

export const validateSecurity: ValidatorFn<Pick<IHttpOperation, 'security'>, Pick<IHttpRequest, 'headers' | 'url'>> = ({
  element,
  resource,
}) => {
  const securitySchemes = resource.security;

  if (!securitySchemes || !securitySchemes.length) {
    return Either.right(element);
  } else {
    return pipe(
      gatherValidationResults(securitySchemes, element),
      Either.fromOption(() => element),
      Either.swap,
      Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
    );
  }
};
