import {
  transformOas2Operations,
  transformOas3Operations,
  transformPostmanCollectionOperations,
} from '@stoplight/http-spec';
import { resolveFile, resolveHttp } from '@stoplight/json-ref-readers';
import { Resolver } from '@stoplight/json-ref-resolver';
import { IHttpOperation } from '@stoplight/types';
import { parse } from '@stoplight/yaml';
import fetch from 'node-fetch';
import * as fs from 'fs';
import { get, uniq } from 'lodash';
import { EOL } from 'os';
import { resolve } from 'path';
import type { Spec } from 'swagger-schema-official';
import type { OpenAPIObject } from 'openapi3-ts';
import type { CollectionDefinition } from 'postman-collection';

const httpAndFileResolver = new Resolver({
  resolvers: {
    https: { resolve: resolveHttp },
    http: { resolve: resolveHttp },
    file: { resolve: resolveFile },
  },
  parseResolveResult: opts => Promise.resolve({ ...opts, result: parse(opts.result) }),
});

export async function getHttpOperationsFromResource(file: string): Promise<IHttpOperation[]> {
  const isRemote = /^https?:\/\//i.test(file);
  const fileContent = await (isRemote
    ? fetch(file).then(d => d.text())
    : fs.promises.readFile(file, { encoding: 'utf8' }));

  return getHttpOperations(fileContent, isRemote ? file : resolve(file));
}

export default async function getHttpOperations(specContent: string, baseUri?: string): Promise<IHttpOperation[]> {
  const parsedContent = parse(specContent);
  const { result: resolvedContent, errors } = await httpAndFileResolver.resolve(parsedContent, { baseUri });

  if (errors.length) {
    const uniqueErrors = uniq(errors.map(error => error.message)).join(EOL);
    throw new Error(
      `There's been an error while trying to resolve external references in your document: ${uniqueErrors}`
    );
  }

  const transformOperations = detectTransformOperationsFn(parsedContent);
  if (!transformOperations) throw new Error('Unsupported document format');

  return transformOperations(resolvedContent);
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
