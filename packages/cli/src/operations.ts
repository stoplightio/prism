import {
  transformOas2Operations,
  transformOas3Operations,
  transformPostmanCollectionOperations,
} from '@stoplight/http-spec';
import { dereference } from 'json-schema-ref-parser';
import { IHttpOperation } from '@stoplight/types';
import fetch from 'node-fetch';
import * as fs from 'fs';
import { get } from 'lodash';
import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';

export async function getHttpOperationsFromResource(file: string): Promise<IHttpOperation[]> {
  const isRemote = /^https?:\/\//i.test(file);
  const fileContent = await (isRemote
    ? fetch(file).then(d => d.text())
    : fs.promises.readFile(file, { encoding: 'utf8' }));

  return getHttpOperationsFromSpec(fileContent);
}

export async function getHttpOperationsFromSpec(specContent: string): Promise<IHttpOperation[]> {
  const result = await dereference(specContent);

  const transformOperations = detectTransformOperationsFn(result);
  if (!transformOperations) throw new Error('Unsupported document format');

  return transformOperations(result as any);
}

function detectTransformOperationsFn(parsedContent: unknown) {
  if (isOpenAPI2(parsedContent)) return transformOas2Operations;
  if (isOpenAPI3(parsedContent)) return transformOas3Operations;
  if (isPostmanCollection(parsedContent)) return transformPostmanCollectionOperations;
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
