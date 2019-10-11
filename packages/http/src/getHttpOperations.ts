import { transformOas2Operation, transformOas3Operation } from '@stoplight/http-spec';
import { Resolver } from '@stoplight/json-ref-resolver';
import { resolveFile, resolveHttp } from '@stoplight/ref-resolvers';
import { IHttpOperation } from '@stoplight/types';
import { parse } from '@stoplight/yaml';
import axios from 'axios';
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
  const fileContent = /^https?:\/\//i.exec(file)
    ? (await axios.get(file, { transformResponse: res => res })).data
    : fs.readFileSync(file, { encoding: 'utf8' });

  return getHttpOperations(fileContent);
}

export default async function getHttpOperations(specContent: string): Promise<IHttpOperation[]> {
  const parsedContent = parse(specContent);
  const { result: resolvedContent, errors } = await httpAndFileResolver.resolve(parsedContent, {
    baseUri: resolve(specContent),
  });

  if (errors.length) {
    const uniqueErrors = uniq(errors.map(error => error.message)).join(EOL);
    throw new Error(
      `There's been an error while trying to resolve external references in your document: ${uniqueErrors}`,
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
          }),
        ),
    ),
  );
}
