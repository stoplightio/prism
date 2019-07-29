import { transformOas2Operation, transformOas3Operation } from '@stoplight/http-spec';
import { parse } from '@stoplight/yaml';
import axios from 'axios';
import * as fs from 'fs';
import { flatten, get, keys, map, uniq } from 'lodash';
import { EOL } from 'os';
import { resolve } from 'path';
import { httpAndFileResolver } from '../resolvers/http-and-file';

export default async function getHttpOperations(spec: string) {
  const fileContent = spec.match(/^https?:\/\//)
    ? (await axios.get(spec)).data
    : fs.readFileSync(spec, { encoding: 'utf8' });
  const parsedContent = parse(fileContent);
  const { result: resolvedContent, errors } = await httpAndFileResolver.resolve(parsedContent, {
    baseUri: resolve(spec),
  });

  if (errors.length) {
    const uniqueErrors = uniq(errors.map(error => error.message)).join(EOL);
    throw new Error(
      `There\'s been an error while trying to resolve external references in your document: ${uniqueErrors}`,
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
