import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { when } from './utils';

export const apiKeyInCookie = {
  test: ({ type, in: where }: SecurityScheme) => where === 'cookie' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const probablyCookie = get(someInput, ['headers', 'cookie']);

    const isApiKeyInCookie = pipe(
      fromNullable(probablyCookie),
      mapNullable(cookie => new RegExp(`${name}=.+`).test(cookie)),
      getOrElse(() => false),
    );

    return when<R>(isApiKeyInCookie, '', resource);
  },
};

export const apiKeyInHeader = {
  test: ({ type, in: where }: SecurityScheme) => where === 'header' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

    return when<R>(isAPIKeyProvided, '', resource);
  },
};

export const apiKeyInQuery = {
  test: ({ type, in: where }: SecurityScheme) => where === 'query' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

    return when<R>(isApiKeyInQuery, '', resource);
  },
};
