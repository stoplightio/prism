import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, partial } from 'lodash';

import { when } from './utils';
import { Dictionary } from '@stoplight/types';
import { IHttpRequest } from '../../../../types';

const bearerHandler = (msg: string, input: Pick<IHttpRequest, 'headers' | 'url'>) =>
  when(isBearerToken(input.headers || {}), msg);

function isBearerToken(inputHeaders: Dictionary<string>) {
  return pipe(
    fromNullable(get(inputHeaders, 'authorization')),
    map(authorization => !!/^Bearer\s.+$/.exec(authorization)),
    getOrElse(() => false)
  );
}

export const bearer = partial(bearerHandler, 'Bearer');
export const oauth2 = partial(bearerHandler, 'OAuth2');
export const openIdConnect = partial(bearerHandler, 'OpenID');
