import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Segment } from '@stoplight/types';
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { getValidation } from 'fp-ts/lib/Either';
import * as Option from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import * as Ajv from 'ajv';
import { JSONSchema } from '../../';
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto' });

export const convertAjvErrors = (errors: Ajv.ErrorObject[] | undefined | null, severity: DiagnosticSeverity) => {
  if (!errors) {
    return [];
  }

  return errors.map<IPrismDiagnostic & { path: Segment[] }>(error => {
    const allowedParameters = 'allowedValues' in error.params ? `: ${error.params.allowedValues.join(', ')}` : '';

    return {
      path: error.dataPath.split('.').slice(1),
      code: error.keyword || '',
      message: `${error.message || ''}${allowedParameters}`,
      severity,
    };
  });
};

export const validateAgainstSchema = (
  value: unknown,
  schema: JSONSchema,
  prefix?: string
): Option.Option<NonEmptyArray<IPrismDiagnostic>> => {
  return pipe(
    Option.tryCatch(() => ajv.compile(schema)),
    Option.chain(validate => {
      const valid = validate(value);
      if (!valid) {
        return Option.some(
          convertAjvErrors(validate.errors, DiagnosticSeverity.Error).map(error => {
            const path = prefix ? [prefix, ...error.path] : error.path;
            return Object.assign({}, error, { path });
          }) as NonEmptyArray<IPrismDiagnostic>
        );
      }
      return Option.none;
    })
  );
};

export const sequenceOption = sequenceT(Option.option);
export const sequenceValidation = sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()));
