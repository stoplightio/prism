import {
  transformOas2Operation,
  transformOas2Service,
  transformOas3Operation,
  transformOas3Service,
} from '@stoplight/http-spec';
import { parse } from '@stoplight/yaml';
import * as fs from 'fs';
import { flatten, get, keys, map } from 'lodash';
import { httpAndFileResolver } from '../resolvers/http-and-file';

export default async function getHttpOperations(spec: string) {
  const fileContent = fs.readFileSync(spec, { encoding: 'utf8' });
  const parsedContent = parse(fileContent);
  const { result: resolvedContent } = await httpAndFileResolver.resolve(parsedContent);

  const isOas2 = get(parsedContent, 'swagger');

  const transformServiceFn = isOas2 ? transformOas2Service : transformOas3Service;
  const transformOperationFn = isOas2 ? transformOas2Operation : transformOas3Operation;

  const service = transformServiceFn({ document: resolvedContent });
  const paths = keys(get(resolvedContent, 'paths'));
  const methods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
  return flatten(
    map(paths, path =>
      keys(get(resolvedContent, ['paths', path]))
        .filter(k => methods.includes(k))
        .map(method =>
          Object.assign(
            transformOperationFn({
              document: resolvedContent,
              path,
              method,
            }),
            service,
          ),
        ),
    ),
  );
}
