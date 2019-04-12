import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { DiagnosticSeverity, ISchema, Segment } from '@stoplight/types';
import { ErrorObject } from 'ajv';
// @ts-ignore
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto' });

export const convertAjvErrors = (
  errors: ErrorObject[] | undefined | null,
  severity: DiagnosticSeverity
) => {
  if (!errors) {
    return [];
  }

  return errors.map<IPrismDiagnostic & { path: Segment[] }>(error => ({
    path: error.dataPath.split('.').slice(1),
    code: error.keyword || '',
    message: error.message || '',
    severity,
  }));
};

export const validateAgainstSchema = (
  value: any,
  schema: ISchema,
  prefix?: string
): IPrismDiagnostic[] => {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(value);
    let errors: IPrismDiagnostic[] = [];
    if (!valid) {
      errors = convertAjvErrors(validate.errors, DiagnosticSeverity.Error).map(error => {
        const path = prefix ? [prefix, ...error.path] : [...error.path];
        return Object.assign({}, error, { path });
      });
    }
    return errors;
  } catch (error) {
    throw new Error(`AJV validation error: "${error}"`);
  }
};
