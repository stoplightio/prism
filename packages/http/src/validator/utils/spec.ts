import { IHttpOperationResponse } from '@stoplight/types';
import { head } from 'fp-ts/Array';
import { Option } from 'fp-ts/Option';
import { IHttpOperationResponseEx } from '../../types';

export function findOperationResponse(
  responseSpecs: IHttpOperationResponseEx[],
  statusCode: number
): Option<IHttpOperationResponseEx> {
  const sortedSpecs = responseSpecs
    .filter(
      spec => new RegExp(`^${spec.code.replace(/X/g, '\\d')}$`).test(String(statusCode)) || spec.code === 'default'
    )
    .sort((s1, s2) => {
      if (s1.code === 'default') {
        return 1;
      }

      if (s2.code === 'default') {
        return -1;
      }

      return s1.code.split('X').length - s2.code.split('X').length;
    });

  return head(sortedSpecs);
}
