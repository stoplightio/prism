import { IHttpOperation } from '@stoplight/types';
import { isSome } from 'fp-ts/lib/Option';
import { createJsonSchemaFromParams, stripReadOnlyProperties, stripWriteOnlyProperties } from '.';
import { IHttpOperationEx, JSONSchema, JSONSchemaEx } from './types';

const EMPTY_SCHEMA: JSONSchema = {};

const bundle = (schema: JSONSchema, bundle?: unknown): JSONSchemaEx => {
  return {
    ...schema,
    __bundled__: bundle,
  };
};

export const enrichWithPreGeneratedValidationSchema = (operations: IHttpOperation[]): IHttpOperationEx[] => {
  operations.forEach(op => {
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
        opEx.request.queryValidatingSchema = bundle(
          createJsonSchemaFromParams(opEx.request.query),
          opEx['__bundled__']
        );
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

    opEx.responses.forEach(res => {
      res.headersValidatingSchema = EMPTY_SCHEMA;
      if (res.headers !== undefined) {
        res.headersValidatingSchema = bundle(createJsonSchemaFromParams(res.headers), opEx['__bundled__']);
      }

      res.contents?.forEach(mtc => {
        mtc.contentValidatingSchema = EMPTY_SCHEMA;
        if (mtc.schema !== undefined) {
          const newLocal = stripWriteOnlyProperties(mtc.schema);
          if (isSome(newLocal)) {
            mtc.contentValidatingSchema = bundle(newLocal.value, opEx['__bundled__']);
          }
        }
      });
    });
  });

  return operations as IHttpOperationEx[];
};
