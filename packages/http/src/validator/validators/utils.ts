import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { NonEmptyArray, fromArray, map } from 'fp-ts/NonEmptyArray';
import type { ErrorObject } from 'ajv';
import { JSONSchema } from '../../';
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, nullable: true, messages: true, schemaId: 'auto' });
const ajvNoCoerce = new AjvOAI({
  allErrors: true,
  nullable: true,
  messages: true,
  schemaId: 'auto',
  coerceTypes: false,
});

export const convertAjvErrors = (errors: NonEmptyArray<ErrorObject>, severity: DiagnosticSeverity, prefix?: string) =>
  pipe(
    errors,
    map<ErrorObject, IPrismDiagnostic>(error => {
      const allowedParameters = 'allowedValues' in error.params ? `: ${error.params.allowedValues.join(', ')}` : '';
      const detectedAdditionalProperties =
        'additionalProperty' in error.params ? `; found '${error.params.additionalProperty}'` : '';
      const errorPath = error.dataPath.split('.').filter(segment => segment !== '');
      const path = prefix ? [prefix, ...errorPath] : errorPath;

      return {
        path,
        code: error.keyword || '',
        message: `${error.message || ''}${allowedParameters}${detectedAdditionalProperties}`,
        severity,
      };
    })
  );

export const validateAgainstSchema = (
  value: unknown,
  schema: JSONSchema,
  coerce: boolean,
  prefix?: string
): O.Option<NonEmptyArray<IPrismDiagnostic>> =>
  pipe(
    O.tryCatch(() => (coerce ? ajv : ajvNoCoerce).compile(schema)),
    O.chainFirst(validateFn => O.tryCatch(() => validateFn(value))),
    O.chain(validateFn => pipe(O.fromNullable(validateFn.errors), O.chain(fromArray))),
    O.map(errors => convertAjvErrors(errors, DiagnosticSeverity.Error, prefix))
  );
