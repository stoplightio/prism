import { fromNullable, getOrElse, map } from 'fp-ts/Option';
import { pipe } from 'fp-ts/pipeable';
import { get, escapeRegExp } from 'lodash';
import { IHttpRequest } from '../../../../types';
import { when } from './utils';

export const apiKeyInCookie = (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const isApiKeyInCookie = pipe(
    fromNullable(input.headers?.['cookie']),
    map(cookie => new RegExp(`${escapeRegExp(name)}=.+`).test(cookie)),
    getOrElse(() => false)
  );

  return when(isApiKeyInCookie, undefined);
};

export const apiKeyInHeader = (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const isAPIKeyProvided = get(input, ['headers', name.toLowerCase()]);

  return when(!!isAPIKeyProvided, undefined);
};

export const apiKeyInQuery = (input: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const isApiKeyInQuery = get(input, ['url', 'query', name]);

  return when(isApiKeyInQuery, undefined);
};
