import { IHttpOperationResponse } from '@stoplight/types';

export function findOperationResponse(
  responseSpecs: IHttpOperationResponse[],
  statusCode: number,
): IHttpOperationResponse | undefined {
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

  return sortedSpecs[0];
}
