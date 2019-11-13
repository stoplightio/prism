import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, partial } from 'lodash';
import { SecurityScheme } from './types';
import { when } from './utils';
import { IHttpRequest, IHttpOperation, Dictionary } from '@stoplight/types';

const bearerHandler = (msg: string, someInput: IHttpRequest, name: string, resource: IHttpOperation) =>
  when(isBearerToken(get(someInput, 'headers')), msg, resource);

function isBearerToken(inputHeaders: Dictionary<string>) {
  return pipe(
    fromNullable(get(inputHeaders, 'authorization')),
    map(authorization => !!/^Bearer\s.+$/.exec(authorization)),
    getOrElse(() => false)
  );
}

export const bearer = {
  test: ({ type, scheme }: SecurityScheme) => scheme === 'bearer' && type === 'http',
  handle: partial(bearerHandler, 'Bearer'),
};

export const oauth2 = {
  test: ({ type }: SecurityScheme) => type === 'oauth2',
  handle: partial(bearerHandler, 'OAuth2'),
};

export const openIdConnect = {
  test: ({ type }: SecurityScheme) => type === 'openIdConnect',
  handle: partial(bearerHandler, 'OpenID'),
};
