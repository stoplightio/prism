import { IHttpOperation, HttpSecurityScheme } from '@stoplight/types';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { flatten } from 'lodash';
import { set } from 'lodash/fp';
import { findSecurityHandler } from './handlers';
import { NonEmptyArray, getSemigroup } from 'fp-ts/NonEmptyArray';
import { isNonEmpty, sequence } from 'fp-ts/Array';
import { IPrismDiagnostic, ValidatorFn } from '@stoplight/prism-core';
import { IHttpRequest } from '../../../types';

type HeadersAndUrl = Pick<IHttpRequest, 'headers' | 'url'>;

const EitherAltValidation = E.getAltValidation(getSemigroup<IPrismDiagnostic>());
const EitherApplicativeValidation = E.getApplicativeValidation(getSemigroup<IPrismDiagnostic>());
const eitherSequence = sequence(EitherApplicativeValidation);

function getValidationResults(securitySchemes: HttpSecurityScheme[][], input: HeadersAndUrl) {
  const [first, ...others] = getAuthenticationArray(securitySchemes, input);
  return others.reduce((prev, current) => EitherAltValidation.alt(prev, () => current), first);
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
        E.chain(securityHandler => securityHandler(input, 'name' in securityScheme ? securityScheme.name : '')),
        E.mapLeft<IPrismDiagnostic, NonEmptyArray<IPrismDiagnostic>>(e => [e])
      )
    );

    return eitherSequence(authResults);
  });
}

export const validateSecurity: ValidatorFn<Pick<IHttpOperation, 'security'>, HeadersAndUrl> = ({ element, resource }) =>
  pipe(
    O.fromNullable(resource.security),
    O.chain(O.fromPredicate(isNonEmpty)),
    O.fold(
      () => E.right(element),
      securitySchemes =>
        pipe(
          getValidationResults(securitySchemes, element),
          E.bimap(
            e => [setErrorTag(e)],
            () => element
          )
        )
    )
  );
