import { isLeft, isRight, Left } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { securitySchemaHandlers } from './handlers';
import { AuthErr, SecurityScheme } from './handlers/types';

import * as Either from 'fp-ts/lib/Either';

function getAllInvalidSec<R>(invalidSecuritySchemas: Array<Left<AuthErr>>) {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const firstLeftValue: AuthErr = pipe(
    invalidSecuritySchemas[0],
    Either.fold<AuthErr, R, AuthErr>(identity, identity),
  );

  return firstLeftValue.status !== 401 || invalidSecuritySchemas.length === 1
    ? firstLeftValue
    : (() => {
        const allWWWAuthHeaders = invalidSecuritySchemas.reduce((accumulator: string, currentValue) => {
          return pipe(
            currentValue,
            Either.mapLeft(err => [accumulator, get(err, pathToHeader)].filter(identity).join(', ')),
            Either.fold(authHeader => authHeader || '', () => ''),
          );
        }, '');

        return set(pathToHeader, allWWWAuthHeaders, firstLeftValue);
      })();
}

export function validateSecurity<R, I>(someInput: I, resource?: R) {
  const securitySchemas = get(resource, 'security', []);

  return !securitySchemas.length
    ? []
    : (() => {
        const validatedSecuritySchemas = securitySchemas.map((definedSecSchema: SecurityScheme) => {
          const schemaHandler = securitySchemaHandlers.find(handler => {
            return handler.test(definedSecSchema);
          });

          return schemaHandler
            ? schemaHandler.handle(someInput, definedSecSchema.name, resource)
            : Either.left({ message: 'No handler for the security scheme found.' });
        });

        const validSecuritySchema = validatedSecuritySchemas.find(isRight);
        const invalidSecuritySchemas = validatedSecuritySchemas.filter(isLeft);

        return validSecuritySchema ? [] : [getAllInvalidSec<R>(invalidSecuritySchemas)];
      })();
}
