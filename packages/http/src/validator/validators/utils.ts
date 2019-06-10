import { IPrismDiagnostic } from '@stoplight/prism-core/src/types';
import { JSONSchema } from '@stoplight/prism-http';
import { DiagnosticSeverity, Segment } from '@stoplight/types';
import * as Ajv from 'ajv';
// @ts-ignore
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto' }) as Ajv.Ajv;

export const convertAjvErrors = (errors: Ajv.ErrorObject[] | undefined | null, severity: DiagnosticSeverity) => {
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

export const validateAgainstSchema = (value: any, schema: JSONSchema, prefix?: string): IPrismDiagnostic[] => {
  try {
    const validate = ajv.compile(schema);
    const valid = validate(value);
    if (!valid) {
      return convertAjvErrors(validate.errors, DiagnosticSeverity.Error).map(error => {
        const path = prefix ? [prefix, ...error.path] : [...error.path];
        return Object.assign({}, error, { path });
      });
    }
    return [];
  } catch (error) {
    throw new Error(`AJV validation error: "${error}"`);
  }
};
