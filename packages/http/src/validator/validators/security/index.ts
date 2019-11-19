import { IHttpOperation, HttpSecurityScheme } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, identity } from 'lodash';
import { noop, set } from 'lodash/fp';
import { findSecurityHandler } from './handlers';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { isNonEmpty, array } from 'fp-ts/lib/Array';
import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';

const eitherSequence = array.sequence(Either.either);

function gatherValidationResults(
  securitySchemes: HttpSecurityScheme[][],
  input: Pick<IHttpRequest, 'headers' | 'url'>
) {
  const authResults = getAuthResults(securitySchemes, input);

  const validSecurityScheme = authResults.some(Either.isRight);
  const invalidSecuritySchemes = authResults.filter(Either.isLeft);

  const firstLeft = invalidSecuritySchemes[0];

  if (!validSecurityScheme && firstLeft) {
    return Option.some(gatherWWWAuthHeader(invalidSecuritySchemes, ['tags'], firstLeft.left));
  } else {
    return Option.none;
  }
}

function gatherWWWAuthHeader(
  authResults: Either.Either<IPrismDiagnostic, unknown>[],
  pathToHeader: string[],
  firstAuthErr: IPrismDiagnostic
) {
  if (authResults.length === 1) {
    return firstAuthErr;
  } else {
    const wwwAuthenticateHeaders = authResults.map(authResult =>
      pipe(
        authResult,
        Either.fold(result => result.tags || [], noop)
      )
    );

    const firstAuthErrWithAuthHeader = set(pathToHeader, flatten(wwwAuthenticateHeaders), firstAuthErr);

    return wwwAuthenticateHeaders.every(identity) ? firstAuthErrWithAuthHeader : firstAuthErr;
  }
}

function getAuthResults(securitySchemes: HttpSecurityScheme[][], input: Pick<IHttpRequest, 'headers' | 'url'>) {
  return securitySchemes.map(securitySchemePairs => {
    const authResults = securitySchemePairs.map(securityScheme =>
      pipe(
        findSecurityHandler(securityScheme),
        Either.chain(f => f(input, 'name' in securityScheme ? securityScheme.name : ''))
      )
    );

    return pipe(
      eitherSequence(authResults),
      Either.mapLeft(err => gatherWWWAuthHeader(authResults, ['tags'], err))
    );
  });
}

export const validateSecurity: ValidatorFn<Pick<IHttpOperation, 'security'>, Pick<IHttpRequest, 'headers' | 'url'>> = ({
  element,
  resource,
}) => {
  const securitySchemes = resource.security;

  if (securitySchemes && isNonEmpty(securitySchemes)) {
    return pipe(
      gatherValidationResults(securitySchemes, element),
      Either.fromOption(() => element),
      Either.swap,
      Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
    );
  } else {
    return Either.right(element);
  }
};
