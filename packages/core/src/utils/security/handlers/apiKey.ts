import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { SecurityScheme } from './types';
import { when } from './utils';

export const apiKeyInCookie = {
  test: ({ type, in: where }: SecurityScheme) => where === 'cookie' && type === 'apiKey',
  handle: (someInput: unknown, name: string, resource?: unknown) => {
    const probablyCookie = get(someInput, ['headers', 'cookie']);

    const isApiKeyInCookie = pipe(
      fromNullable(probablyCookie),
      map(cookie => new RegExp(`${name}=.+`).test(cookie)),
      getOrElse(() => false),
    );

    return when(isApiKeyInCookie, '', resource);
  },
};

export const apiKeyInHeader = {
  test: ({ type, in: where }: SecurityScheme) => where === 'header' && type === 'apiKey',
  handle: (someInput: unknown, name: string, resource?: unknown) => {
    const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

    return when(isAPIKeyProvided, '', resource);
  },
};

export const apiKeyInQuery = {
  test: ({ type, in: where }: SecurityScheme) => where === 'query' && type === 'apiKey',
  handle: (someInput: unknown, name: string, resource?: unknown) => {
    const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

    return when(isApiKeyInQuery, '', resource);
  },
};
