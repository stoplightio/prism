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

function getValidationResults(securitySchemes: HttpSecurityScheme[][], input: Pick<IHttpRequest, 'headers' | 'url'>) {
  const authResults = getAuthResults(securitySchemes, input);

  const validSecurityScheme = authResults.some(Either.isRight);
  const invalidSecuritySchemes = authResults.filter(Either.isLeft);

  const firstLeft = invalidSecuritySchemes[0];

  if (!validSecurityScheme && firstLeft) {
    return Option.some(
      getWWWAuthHeader(
        invalidSecuritySchemes.map(t => t.left),
        ['tags'],
        firstLeft.left
      )
    );
  } else {
    return Option.none;
  }
}

function getWWWAuthHeader(authResults: IPrismDiagnostic[], pathToHeader: string[], firstAuthErr: IPrismDiagnostic) {
  if (authResults.length === 1) {
    return firstAuthErr;
  } else {
    const wwwAuthenticateHeaders = authResults.map(authResult => authResult.tags || []);
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
      Either.mapLeft(err =>
        getWWWAuthHeader(
          authResults.filter(Either.isLeft).map(t => t.left),
          ['tags'],
          err
        )
      )
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
      getValidationResults(securitySchemes, element),
      Either.fromOption(() => element),
      Either.swap,
      Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
    );
  } else {
    return Either.right(element);
  }
};
