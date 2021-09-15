import { transformOas3Operations } from '@stoplight/http-spec/oas3/operation';
import { transformOas2Operations } from '@stoplight/http-spec/oas2/operation';
import { transformPostmanCollectionOperations } from '@stoplight/http-spec/postman/operation';
import { dereference } from 'json-schema-ref-parser';
import { bundleTarget, decycle } from '@stoplight/json';
import { IHttpParam } from '@stoplight/types';
import { compact, get, keyBy, mapValues, pickBy } from 'lodash';

import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';
import { JSONSchema4 } from 'json-schema';
import { JSONSchemaEx, stripReadOnlyProperties, stripWriteOnlyProperties } from '@stoplight/prism-http';
import { isSome } from 'fp-ts/lib/Option';
import { IHttpOperationEx, JSONSchema } from '@stoplight/prism-http';

const bundle = (schema: JSONSchema, bundle?: unknown): JSONSchemaEx => {
  return {
    ...schema,
    __bundled__: bundle,
  };
};

export async function getHttpOperationsFromSpec(specFilePathOrObject: string | object): Promise<IHttpOperationEx[]> {
  const result = decycle(await dereference(specFilePathOrObject));

  let operations: IHttpOperationEx[] = [];
  if (isOpenAPI2(result)) operations = transformOas2Operations(result);
  else if (isOpenAPI3(result)) operations = transformOas3Operations(result);
  else if (isPostmanCollection(result)) operations = transformPostmanCollectionOperations(result);
  else throw new Error('Unsupported document format');

  operations.forEach((op, i, ops) => {
    if (op.request !== undefined) {
      if (op.request.headers !== undefined) {
        op.request.headersValidatingSchema = bundle(createJsonSchemaFromParams(op.request.headers), op['__bundled__']);
      }
      if (op.request.path !== undefined) {
        op.request.pathValidatingSchema = bundle(createJsonSchemaFromParams(op.request.path), op['__bundled__']);
      }
      if (op.request.query !== undefined) {
        op.request.queryValidatingSchema = bundle(createJsonSchemaFromParams(op.request.query), op['__bundled__']);
      }
      if (op.request.body !== undefined) {
        op.request.body.contents?.forEach(mtc => {
          if (mtc.schema !== undefined) {
            const newLocal = stripReadOnlyProperties(mtc.schema);
            if (isSome(newLocal)) {
              mtc.contentValidatingSchema = bundle(newLocal.value, op['__bundled__']);
            }
          }
        });
      }
      op.responses.forEach(res => {
        res.contents?.forEach(mtc => {
          if (mtc.schema !== undefined) {
            const newLocal = stripWriteOnlyProperties(mtc.schema);
            if (isSome(newLocal)) {
              mtc.contentValidatingSchema = bundle(newLocal.value, op['__bundled__']);
            }
          }
        });
      });
    }
    ops[i] = bundleTarget({
      document: {
        ...result,
        __target__: op,
      },
      path: '#/__target__',
      cloneDocument: false,
    });
  });

  return operations;
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

function createJsonSchemaFromParams(params: IHttpParam[]): JSONSchema {
  return {
    type: 'object',
    properties: pickBy(
      mapValues(
        keyBy(params, p => p.name.toLocaleLowerCase()),
        'schema'
      )
    ) as JSONSchema4,
    required: compact(params.map(m => (m.required ? m.name.toLowerCase() : undefined))),
  };
}
