import { getOrElse, isLeft, isRight, map } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { securitySchemaHandlers } from './handlers';

import * as Either from 'fp-ts/lib/Either';

export function validateSecurity(resource: any, someInput: any) {
  const validatedSecuritySchemas = resource.security.map((definedSecSchema: any) => {
    const schemaHandler = securitySchemaHandlers.find(handler => {
      return handler.test(definedSecSchema);
    });

    return schemaHandler
      ? schemaHandler.handle(someInput, resource, definedSecSchema)
      : Either.left('no handler for the security implemented yet!!!!');
  });

  const validSecuritySchema = validatedSecuritySchemas.find(isRight);
  const invalidSecuritySchemas = validatedSecuritySchemas.filter(isLeft);

  return validSecuritySchema || Either.left(getAllInvalidSec(invalidSecuritySchemas));
}

function getAllInvalidSec(invalidSecuritySchemas: any) {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const allWWWAuthHeaders = invalidSecuritySchemas.reduce((accumulator: any, currentValue: any) => {
    return pipe(
      currentValue,
      Either.swap,
      map((err: any) => {
        return err.status === 401 ? [accumulator, get(err, pathToHeader)].filter(identity).join(', ') : accumulator;
      }),
      getOrElse(() => ''),
    ) as any;
  }, '');

  const firstLeftValue = pipe(
    invalidSecuritySchemas[0],
    Either.fold(identity, identity),
  ) as any;

  return set(pathToHeader, allWWWAuthHeaders, firstLeftValue);
}
