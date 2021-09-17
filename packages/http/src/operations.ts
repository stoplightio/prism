import { IHttpOperation, IHttpOperationResponse } from '@stoplight/types';
import { isSome } from 'fp-ts/lib/Option';
import { createJsonSchemaFromParams, stripReadOnlyProperties, stripWriteOnlyProperties } from '.';
import { IHttpOperationEx, IHttpOperationResponseEx, JSONSchema, JSONSchemaEx } from './types';

const EMPTY_SCHEMA: JSONSchema = {};

const bundle = (schema: JSONSchema, bundle?: unknown): JSONSchemaEx => {
  return {
    ...schema,
    __bundled__: bundle,
  };
};

export const enrichAllResponsesWithPreGeneratedValidationSchema = (
  responses: IHttpOperationResponse[],
  bundled?: unknown
): IHttpOperationResponseEx[] => {
  responses.forEach(res => {
    const resEx = res as IHttpOperationResponseEx;

    resEx.headersValidatingSchema = EMPTY_SCHEMA;
    if (resEx.headers !== undefined) {
      resEx.headersValidatingSchema = bundle(createJsonSchemaFromParams(resEx.headers), bundled);
    }

    resEx.contents?.forEach(mtc => {
      mtc.contentValidatingSchema = EMPTY_SCHEMA;
      if (mtc.schema !== undefined) {
        const newLocal = stripWriteOnlyProperties(mtc.schema);
        if (isSome(newLocal)) {
          mtc.contentValidatingSchema = bundle(newLocal.value, bundled);
        }
      }
    });
  });

  return responses as IHttpOperationResponseEx[];
};

export const enrichOperationWithPreGeneratedValidationSchema = (op: IHttpOperation): IHttpOperationEx => {
  const opEx = op as IHttpOperationEx;
  if (opEx.request !== undefined) {
    opEx.request.headersValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.headers !== undefined) {
      opEx.request.headersValidatingSchema = bundle(
        createJsonSchemaFromParams(opEx.request.headers),
        opEx['__bundled__']
      );
    }

    opEx.request.pathValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.path !== undefined) {
      opEx.request.pathValidatingSchema = bundle(createJsonSchemaFromParams(opEx.request.path), opEx['__bundled__']);
    }

    opEx.request.queryValidatingSchema = EMPTY_SCHEMA;
    if (opEx.request.query !== undefined) {
      opEx.request.queryValidatingSchema = bundle(createJsonSchemaFromParams(opEx.request.query), opEx['__bundled__']);
    }

    if (opEx.request.body !== undefined) {
      opEx.request.body.contents?.forEach(mtc => {
        mtc.contentValidatingSchema = EMPTY_SCHEMA;
        if (mtc.schema !== undefined) {
          const newLocal = stripReadOnlyProperties(mtc.schema);
          if (isSome(newLocal)) {
            mtc.contentValidatingSchema = bundle(newLocal.value, opEx['__bundled__']);
          }
        }
      });
    }
  }

  enrichAllResponsesWithPreGeneratedValidationSchema(opEx.responses, opEx['__bundled__']);

  return opEx;
};

export const enrichAllOperationsWithPreGeneratedValidationSchema = (
  operations: IHttpOperation[]
): IHttpOperationEx[] => {
  operations.forEach(op => enrichOperationWithPreGeneratedValidationSchema(op));

  return operations as IHttpOperationEx[];
};
