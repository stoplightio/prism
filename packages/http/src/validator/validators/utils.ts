import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity } from '@stoplight/types';
import * as O from 'fp-ts/lib/Option';
import { Do } from 'fp-ts-contrib/lib/Do';
import { pipe } from 'fp-ts/lib/pipeable';
import { NonEmptyArray, fromArray, map } from 'fp-ts/lib/NonEmptyArray';
import type { ErrorObject } from 'ajv';
import { JSONSchema } from '../../';
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto' });
const ajvNoCoerce = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto', coerceTypes: false });

export const convertAjvErrors = (errors: NonEmptyArray<ErrorObject>, severity: DiagnosticSeverity, prefix?: string) =>
  pipe(
    errors,
    map<ErrorObject, IPrismDiagnostic>(error => {
      const allowedParameters = 'allowedValues' in error.params ? `: ${error.params.allowedValues.join(', ')}` : '';
      const errorPath = error.dataPath.split('.').slice(1);
      const path = prefix ? [prefix, ...errorPath] : errorPath;

      return {
        path,
        code: error.keyword || '',
        message: `${error.message || ''}${allowedParameters}`,
        severity,
      };
    })
  );

export const validateAgainstSchema = (
  value: unknown,
  schema: JSONSchema,
  coerce: boolean,
  prefix?: string
): O.Option<NonEmptyArray<IPrismDiagnostic>> => {
  const ajvInstance = coerce ? ajv : ajvNoCoerce;

  return Do(O.option)
    .bind(
      'validateFn',
      O.tryCatch(() => ajvInstance.compile(schema))
    )
    .doL(({ validateFn }) => O.tryCatch(() => validateFn(value)))
    .bindL('errors', ({ validateFn }) => pipe(O.fromNullable(validateFn.errors), O.chain(fromArray)))
    .return(({ errors }) => convertAjvErrors(errors, DiagnosticSeverity.Error, prefix));
};
