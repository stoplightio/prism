import { fold, isLeft, isRight, Left, left, mapLeft } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { set } from 'lodash/fp';
import { IPrismDiagnostic } from '../../types';
import { securitySchemeHandlers } from './handlers';
import { SecurityScheme } from './handlers/types';

function getAllInvalidSec(invalidSecuritySchemes: Array<Left<IPrismDiagnostic>>): IPrismDiagnostic {
  const pathToHeader = ['headers', 'WWW-Authenticate'];

  const firstLeftValue: IPrismDiagnostic = pipe(
    invalidSecuritySchemes[0],
    fold<IPrismDiagnostic, unknown, IPrismDiagnostic>(identity, identity),
  );

  if (firstLeftValue.code !== 401 || invalidSecuritySchemes.length === 1) {
    return firstLeftValue;
  } else {
    const allWWWAuthHeaders = invalidSecuritySchemes.reduce((accumulator, currentValue) => {
      return pipe(
        currentValue,
        mapLeft(err => [accumulator, get(err, pathToHeader)].filter(identity).join(', ')),
        fold(authHeader => authHeader || '', () => ''),
      );
    }, '');

    return set(pathToHeader, allWWWAuthHeaders, firstLeftValue);
  }
}

export function validateSecurity(someInput: unknown, resource?: unknown): IPrismDiagnostic | undefined {
  const securitySchemes = get(resource, 'security', []);

  if (!securitySchemes.length) return;

  const validatedSecuritySchemes = securitySchemes.map((definedSecScheme: SecurityScheme) => {
    const schemeHandler = securitySchemeHandlers.find(handler => handler.test(definedSecScheme));

    return schemeHandler
      ? schemeHandler.handle(someInput, definedSecScheme.name, resource)
      : left(new Error('We currently do not support this type of security scheme.'));
  });

  const validSecuritySchema = validatedSecuritySchemes.find(isRight);
  const invalidSecuritySchemes = validatedSecuritySchemes.filter(isLeft);

  return validSecuritySchema ? undefined : getAllInvalidSec(invalidSecuritySchemes);
}
