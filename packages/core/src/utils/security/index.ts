import { isLeft, isRight, Left } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { securitySchemeHandlers } from './handlers';
import { SecurityScheme } from './handlers/types';

import * as Either from 'fp-ts/lib/Either';
import { IPrismDiagnostic } from '../../types';

function getAllInvalidSec<R>(invalidSecuritySchemes: Array<Left<IPrismDiagnostic>>): IPrismDiagnostic {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const firstLeftValue: IPrismDiagnostic = pipe(
    invalidSecuritySchemes[0],
    Either.fold<IPrismDiagnostic, R, IPrismDiagnostic>(identity, identity),
  );

  return firstLeftValue.code !== 401 || invalidSecuritySchemes.length === 1
    ? firstLeftValue
    : (() => {
        const allWWWAuthHeaders = invalidSecuritySchemes.reduce((accumulator: string, currentValue) => {
          return pipe(
            currentValue,
            Either.mapLeft(err => [accumulator, get(err, pathToHeader)].filter(identity).join(', ')),
            Either.fold(authHeader => authHeader || '', () => ''),
          );
        }, '');

        return set(pathToHeader, allWWWAuthHeaders, firstLeftValue);
      })();
}

export function validateSecurity<R, I>(someInput: I, resource?: R): IPrismDiagnostic[] {
  const securitySchemes = get(resource, 'security', []);

  return !securitySchemes.length
    ? []
    : (() => {
        const validatedSecuritySchemes = securitySchemes.map((definedSecScheme: SecurityScheme) => {
          const schemeHandler = securitySchemeHandlers.find(handler => {
            return handler.test(definedSecScheme);
          });

          return schemeHandler
            ? schemeHandler.handle(someInput, definedSecScheme.name, resource)
            : Either.left({ message: 'We currently do not support this type of security scheme.' });
        });

        const validSecuritySchema = validatedSecuritySchemes.find(isRight);
        const invalidSecuritySchemes = validatedSecuritySchemes.filter(isLeft);

        return validSecuritySchema ? [] : [getAllInvalidSec<R>(invalidSecuritySchemes)];
      })();
}
