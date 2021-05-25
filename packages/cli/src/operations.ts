import { transformOas3Operations } from '@stoplight/http-spec/oas3/operation';
import { transformOas2Operations } from '@stoplight/http-spec/oas2/operation';
import { transformPostmanCollectionOperations } from '@stoplight/http-spec/postman/operation';
import { dereference } from 'json-schema-ref-parser';
import { bundleTarget, pathToPointer } from '@stoplight/json';
import { IHttpOperation } from '@stoplight/types';
import { get, isPlainObject } from 'lodash';
import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';

export async function getHttpOperationsFromSpec(specFilePathOrObject: string | object): Promise<IHttpOperation[]> {
  const result = decycle(await dereference(specFilePathOrObject));

  let operations: IHttpOperation[] = [];
  if (isOpenAPI2(result)) operations = transformOas2Operations(result);
  else if (isOpenAPI3(result)) operations = transformOas3Operations(result);
  else if (isPostmanCollection(result)) operations = transformPostmanCollectionOperations(result);
  else throw new Error('Unsupported document format');

  operations.forEach((op, i, ops) => {
    // TODO: should we add a __bundled__ property to stoplight/types for http operations?
    ops[i] = bundleTarget({
      document: {
        ...result,
        __target__: op,
      },
      path: '#/__target__',
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

// TODO: remove, need https://github.com/stoplightio/json/pull/90
export const decycle = (obj: unknown, replacer?: (value: any) => any) => {
  const objs = new WeakMap<object, string>();
  return (function derez(value: any, path: string[]) {
    // The new object or array
    let curObj: any;

    // If a replacer function was provided, then call it to get a replacement value.
    if (replacer) value = replacer(value);

    if (isPlainObject(value) || Array.isArray(value)) {
      // The path of an earlier occurance of value
      const oldPath = objs.get(value);
      // If the value is an object or array, look to see if we have already
      // encountered it. If so, return a {"$ref":PATH} object.
      if (oldPath) return { $ref: oldPath };

      objs.set(value, pathToPointer(path));
      // If it is an array, replicate the array.
      if (Array.isArray(value)) {
        curObj = value.map((element, i) => derez(element, [...path, String(i)]));
      } else {
        // It is an object, replicate the object.
        curObj = {};
        Object.keys(value).forEach(name => {
          curObj[name] = derez(value[name], [...path, name]);
        });
      }
      objs.delete(value);
      return curObj;
    }
    return value;
  })(obj, []);
};
