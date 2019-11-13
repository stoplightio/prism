import { fromNullable, getOrElse, map } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';
import { IHttpRequest } from '../../../../../types';
import { when } from './utils';
import { IHttpOperation } from '@stoplight/types';

export const apiKeyInCookie = (someInput: IHttpRequest, name: string, resource: IHttpOperation) => {
  const probablyCookie = get(someInput, ['headers', 'cookie']);

  const isApiKeyInCookie = pipe(
    fromNullable(probablyCookie),
    map(cookie => new RegExp(`${name}=.+`).test(cookie)),
    getOrElse(() => false)
  );

  return when(isApiKeyInCookie, '', resource);
};

export const apiKeyInHeader = (someInput: IHttpRequest, name: string, resource: IHttpOperation) => {
  const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

  return when(!!isAPIKeyProvided, '', resource);
};

export const apiKeyInQuery = (someInput: IHttpRequest, name: string, resource: IHttpOperation) => {
  const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

  return when(isApiKeyInQuery, '', resource);
};
