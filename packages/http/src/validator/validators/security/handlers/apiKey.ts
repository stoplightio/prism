import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { IHttpRequest } from '../../../../types';
import { when } from './utils';

export const apiKeyInCookie = (someInput: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const probablyCookie = get(someInput, ['headers', 'cookie']);

  const isApiKeyInCookie = pipe(
    fromNullable(probablyCookie),
    map(cookie => new RegExp(`${name}=.+`).test(cookie)),
    getOrElse(() => false)
  );

  return when(isApiKeyInCookie, undefined);
};

export const apiKeyInHeader = (someInput: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

  return when(!!isAPIKeyProvided, undefined);
};

export const apiKeyInQuery = (someInput: Pick<IHttpRequest, 'headers' | 'url'>, name: string) => {
  const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

  return when(isApiKeyInQuery, undefined);
};
