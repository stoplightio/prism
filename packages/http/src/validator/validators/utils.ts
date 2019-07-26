import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, Segment } from '@stoplight/types';
import * as Ajv from 'ajv';
// @ts-ignore
import * as AjvOAI from 'ajv-oai';
import { j2xParser, validate as validateXML } from 'fast-xml-parser';
import { is } from 'type-is';
import { JSONSchema } from '../../';

type Validation = { title: string; detail: string; severity: number; message: string };
type Validator = { test: (a: string) => boolean; validate: (a: string) => Validation[] };

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

const JSONtoXMLParser = new j2xParser({});

const validatorsOfExamples: Validator[] = [
  {
    test: (mediaType: string) => !!is(mediaType, ['application/*+xml', 'application/xml']),
    validate: (target: string | object) => {
      const validationResult = validateXML(typeof target === 'object' ? JSONtoXMLParser.parse(target) : target);

      return validationResult === true
        ? []
        : [
            {
              title: 'Provided example is not an XML file',
              detail: validationResult.err.code,
              severity: 0,
              message: validationResult.err.msg,
            },
          ];
    },
  },
];

export function checkExamples(target: any, mediaType: string = '') {
  const matchedValidator = validatorsOfExamples.find((validator: Validator) => validator.test(mediaType));
  const validation = matchedValidator && matchedValidator.validate(target);

  return validation ? validation : [];
}
