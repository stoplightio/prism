import { IHttpOperation, HttpSecurityScheme } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten } from 'lodash';
import { set } from 'lodash/fp';
import { findSecurityHandler } from './handlers';
import { NonEmptyArray, getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { isNonEmpty, array } from 'fp-ts/lib/Array';
import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';

type HeadersAndUrl = Pick<IHttpRequest, 'headers' | 'url'>;

const EitherValidation = Either.getValidation(getSemigroup<IPrismDiagnostic>());
const eitherSequence = array.sequence(EitherValidation);

function getValidationResults(securitySchemes: HttpSecurityScheme[][], input: HeadersAndUrl) {
  const [first, ...others] = getAuthenticationArray(securitySchemes, input);
  return others.reduce((prev, current) => EitherValidation.alt(prev, () => current), first);
}

function setErrorTag(authResults: NonEmptyArray<IPrismDiagnostic>) {
  const tags = authResults.map(authResult => authResult.tags || []);
  return set(['tags'], flatten(tags), authResults[0]);
}

function getAuthenticationArray(securitySchemes: HttpSecurityScheme[][], input: HeadersAndUrl) {
  return securitySchemes.map(securitySchemePairs => {
    const authResults = securitySchemePairs.map(securityScheme =>
      pipe(
        findSecurityHandler(securityScheme),
        Either.chain(securityHandler => securityHandler(input, 'name' in securityScheme ? securityScheme.name : '')),
        Either.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
      )
    );

    return eitherSequence(authResults);
  });
}

export const validateSecurity: ValidatorFn<Pick<IHttpOperation, 'security'>, HeadersAndUrl> = ({ element, resource }) =>
  pipe(
    Option.fromNullable(resource.security),
    Option.chain(Option.fromPredicate(isNonEmpty)),
    Option.fold(
      () => Either.right(element),
      securitySchemes =>
        pipe(
          getValidationResults(securitySchemes, element),
          Either.mapLeft<NonEmptyArray<IPrismDiagnostic>, NonEmptyArray<IPrismDiagnostic>>(e => [setErrorTag(e)]),
          Either.map(() => element)
        )
    )
  );
