import { getOrElse, isLeft, isRight, Left, map } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { AuthErr, securitySchemaHandlers, SecurityScheme } from './handlers';

import * as Either from 'fp-ts/lib/Either';

export function validateSecurity<R, I>(someInput: I, resource?: R) {
  const securitySchemas = get(resource, 'security', []);

  const validatedSecuritySchemas = securitySchemas.map((definedSecSchema: SecurityScheme) => {
    const schemaHandler = securitySchemaHandlers.find(handler => {
      return handler.test(definedSecSchema);
    });

    return schemaHandler
      ? schemaHandler.handle<R, I>(someInput, definedSecSchema.name, resource)
      : Either.left('no handler for the security implemented yet!!!!');
  });

  const validSecuritySchema = validatedSecuritySchemas.find(isRight);
  const invalidSecuritySchemas = validatedSecuritySchemas.filter(isLeft);

  return validSecuritySchema || Either.left(getAllInvalidSec<R>(invalidSecuritySchemas));
}

function getAllInvalidSec<R>(invalidSecuritySchemas: Array<Left<AuthErr>>) {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const allWWWAuthHeaders = invalidSecuritySchemas.reduce((accumulator: string, currentValue) => {
    return pipe(
      currentValue,
      Either.swap,
      map(err => {
        return err.status === 401 ? [accumulator, get(err, pathToHeader)].filter(identity).join(', ') : accumulator;
      }),
      getOrElse(() => ''),
    );
  }, '');

  const firstLeftValue: AuthErr = pipe(
    invalidSecuritySchemas[0],
    Either.fold<AuthErr, R, AuthErr>(identity, identity),
  );

  return set(pathToHeader, allWWWAuthHeaders, firstLeftValue);
}
