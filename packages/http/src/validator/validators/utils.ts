import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Segment } from '@stoplight/types';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { getValidation } from 'fp-ts/lib/Either';
import { option } from 'fp-ts/lib/Option';
import { sequenceT } from 'fp-ts/lib/Apply';
import * as Ajv from 'ajv';
import { JSONSchema } from '../../';
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

export const sequenceValidation = sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()));
export const sequenceOption = sequenceT(option);
