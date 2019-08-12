import { Either, fold, isLeft, isRight, Left, left } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { flatten, get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { securitySchemaHandlers } from './handlers';
import { AuthResult, SecurityScheme } from './handlers/types';

function gatherWWWAuthHeader(
  authResults: Array<Array<Either<AuthResult, AuthResult>>>,
  pathToHeader: string[],
  firstAuthErr: AuthResult,
) {
  const flattenedAuthResults = flatten(authResults);

  return flattenedAuthResults.length === 1
    ? firstAuthErr
    : (() => {
        const wwwAuthenticateHeaders = flattenedAuthResults.map(authResult => {
          const headers = pipe(
            authResult,
            fold((result: AuthResult) => result.headers, (result: AuthResult) => result.headers),
          );

          return (headers && headers['WWW-Authenticate']) || '';
        });

        return wwwAuthenticateHeaders.every(identity)
          ? set(pathToHeader, wwwAuthenticateHeaders.join(', '), firstAuthErr)
          : firstAuthErr;
      })();
}

function getAllInvalidSec<R>(invalidSecuritySchemes: Array<Array<Left<AuthResult>>>) {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const firstLeftValue: AuthResult = pipe(
    invalidSecuritySchemes[0].find(isLeft) || left({}),
    fold<AuthResult, R, AuthResult>(identity, identity),
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
            const schemeHandler = securitySchemaHandlers.find(handler => {
              return handler.test(definedSecSchema);
            });

            return schemeHandler
              ? schemeHandler.handle(someInput, definedSecSchema.name, resource)
              : left({ message: 'No handler for the security scheme found.' });
          });

          const firstAuthErrAsLeft = authResult.find(isLeft);

          return firstAuthErrAsLeft
            ? (() => {
                const firstAuthErr: AuthResult = pipe(
                  firstAuthErrAsLeft,
                  fold<AuthResult, AuthResult, AuthResult>(identity, identity),
                );

                return [left(gatherWWWAuthHeader([authResult], ['headers', 'WWW-Authenticate'], firstAuthErr))];
              })()
            : authResult;
        });

        const validSecuritySchema = authResults.find((authResult: Array<Either<AuthResult, AuthResult>>) =>
          authResult.every(isRight),
        );
        const invalidSecuritySchemes = authResults.filter((authResult: Array<Either<AuthResult, AuthResult>>) =>
          authResult.some(isLeft),
        );

        return validSecuritySchema ? [] : [getAllInvalidSec<R>(invalidSecuritySchemes)];
      })();
}
