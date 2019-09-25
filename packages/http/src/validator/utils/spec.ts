import { IHttpOperationResponse } from '@stoplight/types';
import { fromNullable, Option } from 'fp-ts/lib/Option';

export function findOperationResponse(
  responseSpecs: IHttpOperationResponse[],
  statusCode: number,
): Option<IHttpOperationResponse> {
  const sortedSpecs = responseSpecs
    .filter(
      spec =>
        new RegExp(`^${spec.code.replace(/X/g, '\\d')}$`).test(String(statusCode)) ||
        spec.code.toLowerCase() === 'default',
    )
    .sort((s1, s2) => {
      if (s1.code.toLowerCase() === 'default') {
        return 1;
      }

      if (s2.code.toLowerCase() === 'default') {
        return -1;
      }

      return s1.code.split('X').length - s2.code.split('X').length;
    });

  return fromNullable(sortedSpecs[0]);
}
