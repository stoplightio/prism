import { IHttpOperation, HttpSecurityScheme } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, identity } from 'lodash';
import { set } from 'lodash/fp';
import { findSecurityHandler } from './handlers';
import { NonEmptyArray, getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { isNonEmpty, array } from 'fp-ts/lib/Array';
import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';

const EV = Either.getValidation(getSemigroup<IPrismDiagnostic>());
const eitherSequence = array.sequence(EV);

function getValidationResults(securitySchemes: HttpSecurityScheme[][], input: Pick<IHttpRequest, 'headers' | 'url'>) {
  const [first, ...others] = getAuthResultsAND(securitySchemes, input);

  return pipe(
    others.reduce((prev, current) => EV.alt(prev, () => current), first),
    Either.mapLeft(getWWWAuthHeader)
  );
}

function getWWWAuthHeader(authResults: IPrismDiagnostic[]) {
  if (authResults.length === 1) {
    return authResults[0];
  } else {
    const wwwAuthenticateHeaders = authResults.map(authResult => authResult.tags || []);
    const firstAuthErrWithAuthHeader = set(['tags'], flatten(wwwAuthenticateHeaders), authResults[0]);

    return wwwAuthenticateHeaders.every(identity) ? firstAuthErrWithAuthHeader : authResults[0];
  }
}

function getAuthResultsAND(securitySchemes: HttpSecurityScheme[][], input: Pick<IHttpRequest, 'headers' | 'url'>) {
  return securitySchemes.map(securitySchemePairs => {
    const authResults = securitySchemePairs.map(securityScheme =>
      pipe(
        findSecurityHandler(securityScheme),
        Either.chain(f => f(input, 'name' in securityScheme ? securityScheme.name : '')),
        Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
      )
    );

    return eitherSequence(authResults);
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
      Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e]),
      Either.map(() => element)
    );
  } else {
    return Either.right(element);
  }
};
