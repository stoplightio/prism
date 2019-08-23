import { fold, isLeft, isRight, Left, left, mapLeft } from 'fp-ts/lib/Either';
import { none, Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, identity } from 'lodash';
import { IPrismDiagnostic } from '../../types';
import { securitySchemeHandlers } from './handlers';
import { SecurityScheme } from './handlers/types';

function getAllInvalidSec(invalidSecuritySchemes: Array<Left<IPrismDiagnostic>>): IPrismDiagnostic {
  const firstLeftValue = pipe(
    invalidSecuritySchemes[0],
    fold<IPrismDiagnostic, unknown, IPrismDiagnostic>(identity, identity),
  );

  if (firstLeftValue.code !== 401 || invalidSecuritySchemes.length === 1) {
    return firstLeftValue;
  } else {
    const allWWWAuthHeaders = invalidSecuritySchemes.reduce((accumulator, currentValue) => {
      return pipe(
        currentValue,
        mapLeft(err => [accumulator, get(err, ['headers', 'WWW-Authenticate'])].filter(identity).join(', ')),
        fold(authHeader => authHeader || '', () => ''),
      );
    }, '');

    if (allWWWAuthHeaders !== '') {
      return firstLeftValue.tags
        ? Object.assign({}, firstLeftValue, { tags: firstLeftValue.tags.concat(allWWWAuthHeaders) })
        : Object.assign({}, firstLeftValue, { tags: [allWWWAuthHeaders] });
    } else {
      return firstLeftValue;
    }
  }
}

export function validateSecurity(someInput: unknown, resource?: unknown): Option<IPrismDiagnostic> {
  const securitySchemes = get(resource, 'security', []);

  if (!securitySchemes.length) {
    return none;
  }

  const validatedSecuritySchemes = securitySchemes.map((definedSecScheme: SecurityScheme) => {
    const schemeHandler = securitySchemeHandlers.find(handler => handler.test(definedSecScheme));

    return schemeHandler
      ? schemeHandler.handle(someInput, definedSecScheme.name, resource)
      : left(new Error('We currently do not support this type of security scheme.'));
  });

  const validSecuritySchema = validatedSecuritySchemes.find(isRight);
  const invalidSecuritySchemes = validatedSecuritySchemes.filter(isLeft);

  return validSecuritySchema ? none : some(getAllInvalidSec(invalidSecuritySchemes));
}
