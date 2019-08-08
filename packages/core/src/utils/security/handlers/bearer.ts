import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { when } from './utils';

const bearerHandler = <R, I>(msg: string, someInput: I, name: string, resource?: R) => {
  return when<R>(isBearerToken(get(someInput, 'headers')), msg, resource);
};

function isBearerToken(inputHeaders: Headers) {
  return pipe(
    fromNullable(get(inputHeaders, 'authorization')),
    mapNullable(authorization => !!authorization.match(/^Bearer\s.+$/)),
    getOrElse(() => false),
  );
}

export const bearer = {
  test: ({ type, scheme }: SecurityScheme) => scheme === 'bearer' && type === 'http',
  handle: bearerHandler.bind({}, 'Bearer'),
};

export const oauth2 = {
  test: ({ type }: SecurityScheme) => type === 'oauth2',
  handle: bearerHandler.bind({}, 'OAuth2'),
};

export const openIdConnect = {
  test: ({ type }: SecurityScheme) => type === 'openIdConnect',
  handle: bearerHandler.bind({}, 'OpenID'),
};
