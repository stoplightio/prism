import { transformOas2Operation, transformOas3Operation } from '@stoplight/http-spec';
import { parse } from '@stoplight/yaml';
import * as fs from 'fs';
import { flatten, get, keys, map } from 'lodash';
import { httpAndFileResolver } from '../resolvers/http-and-file';

export default async function getHttpOperations(spec: string) {
  const fileContent = fs.readFileSync(spec, { encoding: 'utf8' });
  const parsedContent = parse(fileContent);
  const { result: resolvedContent } = await httpAndFileResolver.resolve(parsedContent);

  const transformFn = get(parsedContent, 'swagger') ? transformOas2Operation : transformOas3Operation;

  const paths = keys(get(resolvedContent, 'paths'));
  return flatten(
    map(paths, path =>
      keys(get(resolvedContent, ['paths', path])).map(method =>
        transformFn({
          document: resolvedContent,
          path,
          method,
        }),
      ),
    ),
  );
}
