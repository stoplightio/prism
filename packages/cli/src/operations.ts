import { transformOas3Operations } from '@stoplight/http-spec/oas3/operation';
import { transformOas2Operations } from '@stoplight/http-spec/oas2/operation';
import { transformPostmanCollectionOperations } from '@stoplight/http-spec/postman/operation';
import { dereference } from 'json-schema-ref-parser';
import { bundleTarget, decycle } from '@stoplight/json';
import { IHttpOperation } from '@stoplight/types';
import { get } from 'lodash';

import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';
import { isSome } from 'fp-ts/lib/Option';
import {
  stripReadOnlyProperties,
  stripWriteOnlyProperties,
  IHttpOperationEx,
  JSONSchema,
  JSONSchemaEx,
  createJsonSchemaFromParams,
} from '@stoplight/prism-http';

const bundle = (schema: JSONSchema, bundle?: unknown): JSONSchemaEx => {
  return {
    ...schema,
    __bundled__: bundle,
  };
};

export async function getHttpOperationsFromSpec(specFilePathOrObject: string | object): Promise<IHttpOperationEx[]> {
  const result = decycle(await dereference(specFilePathOrObject));

  let operations: IHttpOperation[] = [];
  if (isOpenAPI2(result)) operations = transformOas2Operations(result);
  else if (isOpenAPI3(result)) operations = transformOas3Operations(result);
  else if (isPostmanCollection(result)) operations = transformPostmanCollectionOperations(result);
  else throw new Error('Unsupported document format');

  operations.forEach((op, i, ops) => {
    const opEx = op as IHttpOperationEx;
    if (opEx.request !== undefined) {
      opEx.request.headersValidatingSchema = {};
      if (opEx.request.headers !== undefined) {
        opEx.request.headersValidatingSchema = bundle(
          createJsonSchemaFromParams(opEx.request.headers),
          opEx['__bundled__']
        );
      }

      opEx.request.pathValidatingSchema = {};
      if (opEx.request.path !== undefined) {
        opEx.request.pathValidatingSchema = bundle(createJsonSchemaFromParams(opEx.request.path), opEx['__bundled__']);
      }

      opEx.request.queryValidatingSchema = {};
      if (opEx.request.query !== undefined) {
        opEx.request.queryValidatingSchema = bundle(
          createJsonSchemaFromParams(opEx.request.query),
          opEx['__bundled__']
        );
      }

      if (opEx.request.body !== undefined) {
        opEx.request.body.contents?.forEach(mtc => {
          mtc.contentValidatingSchema = {};
          if (mtc.schema !== undefined) {
            const newLocal = stripReadOnlyProperties(mtc.schema);
            if (isSome(newLocal)) {
              mtc.contentValidatingSchema = bundle(newLocal.value, opEx['__bundled__']);
            }
          }
        });
      }

      opEx.responses.forEach(res => {
        res.headersValidatingSchema = {};
        if (res.headers !== undefined) {
          res.headersValidatingSchema = bundle(createJsonSchemaFromParams(res.headers), opEx['__bundled__']);
        }

        res.contents?.forEach(mtc => {
          mtc.contentValidatingSchema = {};
          if (mtc.schema !== undefined) {
            const newLocal = stripWriteOnlyProperties(mtc.schema);
            if (isSome(newLocal)) {
              mtc.contentValidatingSchema = bundle(newLocal.value, opEx['__bundled__']);
            }
          }
        });
      });
    }
    ops[i] = bundleTarget({
      document: {
        ...result,
        __target__: opEx,
      },
      path: '#/__target__',
      cloneDocument: false,
    });
  });

  return operations as IHttpOperationEx[];
}

function isOpenAPI2(document: unknown): document is Spec {
  return get(document, 'swagger');
}

function isOpenAPI3(document: unknown): document is OpenAPIObject {
  return get(document, 'openapi');
}

function isPostmanCollection(document: unknown): document is CollectionDefinition {
  return Array.isArray(get(document, 'item')) && get(document, 'info.name');
}
