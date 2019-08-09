import { isLeft, isRight, Left, left } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { securitySchemaHandlers } from './handlers';
import { AuthErr, SecurityScheme } from './handlers/types';

import * as Either from 'fp-ts/lib/Either';

function gatherWWWAuthHeader(
  authResults: Array<Array<Either.Either<any, any>>>,
  pathToHeader: string[],
  firstAuthErr: AuthErr,
) {
  const flattenedAuthResults = flatten(authResults);

  return flattenedAuthResults.length === 1
    ? firstAuthErr
    : (() => {
        const wwwAuthenticateHeaders = flattenedAuthResults.map((authResult: Either.Either<AuthErr, any>) => {
          const headers = pipe(
            authResult,
            Either.fold((authErr: AuthErr) => authErr.headers, (authErr: { headers: any }) => authErr.headers),
          );

          return (headers && headers['WWW-Authenticate']) || '';
        });

        return wwwAuthenticateHeaders.every(identity)
          ? set(pathToHeader, wwwAuthenticateHeaders.join(', '), firstAuthErr)
          : firstAuthErr;
      })();
}

function getAllInvalidSec<R>(invalidSecuritySchemes: Array<Array<Left<any>>>) {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const firstLeftValue: AuthErr = pipe(
    invalidSecuritySchemes[0].find(isLeft) || left({}),
    Either.fold<AuthErr, R, AuthErr>(identity, identity),
  );

  return firstLeftValue.status !== 401
    ? firstLeftValue
    : gatherWWWAuthHeader(invalidSecuritySchemes, pathToHeader, firstLeftValue);
}

export function validateSecurity<R, I>(someInput: I, resource?: R) {
  const securitySchemes = get(resource, 'security', []);

  return !securitySchemes.length
    ? []
    : (() => {
        const authResults = securitySchemes.map((securityScheme: SecurityScheme[]) => {
          const authResult = securityScheme.map((definedSecSchema: SecurityScheme) => {
            const schemaHandler = securitySchemaHandlers.find(handler => {
              return handler.test(definedSecSchema);
            });

            return schemaHandler
              ? schemaHandler.handle(someInput, definedSecSchema.name, resource)
              : Either.left({ message: 'No handler for the security scheme found.' });
          });

          const firstAuthErrAsLeft = authResult.find(isLeft);

          return firstAuthErrAsLeft
            ? (() => {
                const firstAuthErr: AuthErr = pipe(
                  firstAuthErrAsLeft,
                  Either.fold<any, any, AuthErr>(identity, identity),
                );

                const authErr = gatherWWWAuthHeader([authResult], ['headers', 'WWW-Authenticate'], firstAuthErr);

                return [Either.left(authErr)];
              })()
            : authResult;
        });

        const validSecuritySchema = authResults.find((authResult: Array<Either.Either<AuthErr, any>>) =>
          authResult.every(isRight),
        );
        const invalidSecuritySchemes = authResults.filter((authResult: Array<Either.Either<AuthErr, any>>) =>
          authResult.some(isLeft),
        );

        return validSecuritySchema ? [] : [getAllInvalidSec<R>(invalidSecuritySchemes)];
      })();
}
