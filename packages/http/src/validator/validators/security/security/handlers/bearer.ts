import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get, partial } from 'lodash';
import { when } from './utils';
import {
  IHttpOperation,
  Dictionary,
  IBearerSecurityScheme,
  IOpenIdConnectSecurityScheme,
  IOauth2SecurityScheme,
} from '@stoplight/types';
import { IHttpRequest } from '../../../../../types';

const bearerHandler = (msg: string, someInput: IHttpRequest, name: string, resource: IHttpOperation) =>
  when(isBearerToken(someInput.headers || {}), msg, resource);

function isBearerToken(inputHeaders: Dictionary<string>) {
  return pipe(
    fromNullable(get(inputHeaders, 'authorization')),
    map(authorization => !!/^Bearer\s.+$/.exec(authorization)),
    getOrElse(() => false)
  );
}

export const bearer = {
  test: ({ type, scheme }: IBearerSecurityScheme) => scheme === 'bearer' && type === 'http',
  handle: partial(bearerHandler, 'Bearer'),
};

export const oauth2 = {
  test: ({ type }: IOauth2SecurityScheme) => type === 'oauth2',
  handle: partial(bearerHandler, 'OAuth2'),
};

export const openIdConnect = {
  test: ({ type }: IOpenIdConnectSecurityScheme) => type === 'openIdConnect',
  handle: partial(bearerHandler, 'OpenID'),
};
