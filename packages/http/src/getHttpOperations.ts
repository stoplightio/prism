import { transformOas2Operation, transformOas3Operation } from '@stoplight/http-spec';
import { resolveFile, resolveHttp } from '@stoplight/json-ref-readers';
import { Resolver } from '@stoplight/json-ref-resolver';
import { IHttpOperation } from '@stoplight/types';
import { parse } from '@stoplight/yaml';
import fetch from 'node-fetch';
import * as fs from 'fs';
import { flatten, get, keys, map, uniq } from 'lodash';
import { EOL } from 'os';
import { resolve } from 'path';

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
  const fileContent = isRemote ? await fetch(file).then(d => d.text()) : fs.readFileSync(file, { encoding: 'utf8' });

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

  const isOas2 = get(parsedContent, 'swagger');

  const transformOperationFn = isOas2 ? transformOas2Operation : transformOas3Operation;

  const paths = keys(get(resolvedContent, 'paths'));
  const methods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
  return flatten(
    map(paths, path =>
      keys(get(resolvedContent, ['paths', path]))
        .filter(pathKey => methods.includes(pathKey))
        .map(method =>
          transformOperationFn({
            document: resolvedContent,
            path,
            method,
          })
        )
    )
  );
}
