import { IHttpOperationResponse } from '@stoplight/types';

export function findOperationResponse(
  responseSpecs: IHttpOperationResponse[],
  statusCode: number,
): IHttpOperationResponse | undefined {
  const sortedSpecs = responseSpecs
    .filter(spec => new RegExp(`^${spec.code.replace(/X/g, '\\d')}$`).test(String(statusCode)))
    .sort((s1, s2) => s1.code.split('X').length - s2.code.split('X').length);

  return sortedSpecs[0];
}
