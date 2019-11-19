import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Segment } from '@stoplight/types';
import { getSemigroup } from 'fp-ts/lib/NonEmptyArray';
import { getValidation } from 'fp-ts/lib/Either';
import { option } from 'fp-ts/lib/Option';
import { sequenceT } from 'fp-ts/lib/Apply';
import { ErrorObject } from 'ajv';
import * as betterAjvErrors from 'better-ajv-errors';
import { JSONSchema } from '../../';
import * as AjvOAI from 'ajv-oai';

const ajv = new AjvOAI({ allErrors: true, messages: true, schemaId: 'auto', jsonPointers: true });

export const convertAjvErrors = (errors: ErrorObject[] | undefined | null, severity: DiagnosticSeverity) => {
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
      const enhacedMessages = betterAjvErrors(schema, value, validate.errors, { format: 'js' });
      return convertAjvErrors(validate.errors, DiagnosticSeverity.Error).map((error, index) => {
        const path = prefix ? [prefix, ...error.path] : [...error.path];
        return Object.assign({}, error, { path, message: enhacedMessages[index].error });
      });
    }
    return [];
  } catch (error) {
    throw new Error(`AJV validation error: "${error}"`);
  }
};

export const sequenceValidation = sequenceT(getValidation(getSemigroup<IPrismDiagnostic>()));
export const sequenceOption = sequenceT(option);
