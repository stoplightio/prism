import { Dictionary } from '@stoplight/types/dist';
import * as Either from 'fp-ts/lib/Either';
import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';

export type Err = { message: string; status: number; headers: Dictionary<string, string> };
export type Handler = { type: string; name: string; in?: string; scheme?: string };

const unauthorisedErr = (msg: string): Err => ({
  message: '',
  status: 401,
  headers: { 'WWW-Authenticate': msg },
});

function isTokenOK(token: string) {
  const tokenParts = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  return tokenParts.length === 2;
}

const httpBasic = {
  test: ({ scheme, type }: Handler) => {
    return scheme === 'basic' && type === 'http';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader<R>(authorizationHeader, resource)
      : Either.left(unauthorisedErr('Basic realm="*"'));
  },
};

function checkHeader<R>(authorizationHeader: string, resource?: R) {
  const [schema, token] = authorizationHeader.split(' ');

  const isTokenOKEY = token && isTokenOK(token);
  const isBasicSchema = schema === 'Basic';

  // @ts-ignore
  return [
    {
      test: () => {
        return isBasicSchema && isTokenOKEY;
      },
      h: () => Either.right(resource),
    },
    {
      test: () => isBasicSchema,
      h: () => {
        return Either.left({ status: 403, message: '', headers: {} });
      },
    },
    {
      test: () => true,
      h: () => {
        return unauthorisedErr('Basic realm="*"');
      },
    },
  ]
    .find(ui => ui.test())
    .h();
}

const apiKeyInHeader = {
  test: ({ type, in: where }: Handler) => {
    return where === 'header' && type === 'apiKey';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

    return when<R>(isAPIKeyProvided, name, resource);
  },
};

const apiKeyInQuery = {
  test: ({ type, in: where }: Handler) => {
    return where === 'query' && type === 'apiKey';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

    return when<R>(isApiKeyInQuery, name, resource);
  },
};

const openIdConnect = {
  test: ({ type }: Handler) => {
    return type === 'openIdConnect';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    return when<R>(isBearerToken(get(someInput, 'headers')), name, resource);
  },
};

const bearer = {
  test: ({ type, scheme }: Handler) => {
    return scheme === 'bearer' && type === 'http';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    return when<R>(isBearerToken(get(someInput, 'headers')), name, resource);
  },
};

const oauth2 = {
  test: ({ type }: Handler) => {
    return type === 'oauth2';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    return when<R>(isBearerToken(get(someInput, 'headers')), name, resource);
  },
};

const apiKeyInCookie = {
  test: ({ type, in: where }: Handler) => {
    return where === 'cookie' && type === 'apiKey';
  },
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const probablyCookie = get(someInput, ['headers', 'cookie']);

    const isApiKeyInCookie = pipe(
      fromNullable(probablyCookie),
      mapNullable(cookie => {
        return new RegExp(`${name}=.+`).test(cookie);
      }),
      getOrElse(() => false),
    );

    return when<R>(isApiKeyInCookie, `Cookie realm="*" cookie-name=${name}`, resource);
  },
};

function when<R>(isOk: boolean, msg: string, resource?: R) {
  return isOk ? Either.right(resource) : Either.left(unauthorisedErr(msg));
}

export const securitySchemaHandlers = [
  httpBasic,
  apiKeyInHeader,
  apiKeyInQuery,
  apiKeyInCookie,
  oauth2,
  bearer,
  openIdConnect,
];

function isBearerToken(probablyHeaders: Dictionary<string, string>) {
  return pipe(
    fromNullable(probablyHeaders),
    mapNullable(headers => headers.authorization),
    mapNullable(authorization => {
      return !!authorization.match(/^Bearer\s.+$/);
    }),
    getOrElse(() => false),
  );
}
