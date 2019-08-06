import { Dictionary } from '@stoplight/types/dist';
import * as Either from 'fp-ts/lib/Either';
import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';

type Headers = Dictionary<string, string>;

export type AuthErr = { name: string; message: string; status: number; headers: Headers };
export type SecurityScheme = { type: string; name: string; in?: string; scheme?: string };

const genUnauthorisedErr = (msg: string): AuthErr => ({
  name: 'Unauthorised',
  message: 'Invalid security scheme used',
  status: 401,
  headers: { 'WWW-Authenticate': msg },
});

function isBasicToken(token: string) {
  const tokenParts = Buffer.from(token, 'base64')
    .toString()
    .split(':');

  return tokenParts.length === 2;
}

const httpBasic = {
  test: ({ scheme, type }: SecurityScheme) => scheme === 'basic' && type === 'http',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader<R>(authorizationHeader, resource)
      : Either.left(genUnauthorisedErr('Basic realm="*"'));
  },
};

function checkHeader<R>(authorizationHeader: string, resource?: R) {
  const [schema, token] = authorizationHeader.split(' ');

  const isBasicTokenGiven = token && isBasicToken(token);
  const isBasicSchema = schema === 'Basic';

  const handler = [
    {
      test: () => isBasicSchema && isBasicTokenGiven,
      handle: () => Either.right(resource),
    },
    {
      test: () => isBasicSchema,
      handle: () => Either.left({ name: 'Forbidden', status: 403, message: 'Invalid credentials used', headers: {} }),
    },
  ].find(possibleHandler => possibleHandler.test());

  return handler ? handler.handle() : Either.left(genUnauthorisedErr('Basic realm="*"'));
}

const apiKeyInHeader = {
  test: ({ type, in: where }: SecurityScheme) => where === 'header' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isAPIKeyProvided = get(someInput, ['headers', name.toLowerCase()]);

    return when<R>(isAPIKeyProvided, name, resource);
  },
};

const apiKeyInQuery = {
  test: ({ type, in: where }: SecurityScheme) => where === 'query' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const isApiKeyInQuery = get(someInput, ['url', 'query', name]);

    return when<R>(isApiKeyInQuery, name, resource);
  },
};

const bearerHandler = <R, I>(msg: string, someInput: I, name: string, resource?: R) => {
  return when<R>(isBearerToken(get(someInput, 'headers')), msg, resource);
};

const openIdConnect = {
  test: ({ type }: SecurityScheme) => type === 'openIdConnect',
  handle: bearerHandler.bind({}, 'OpenID'),
};

const bearer = {
  test: ({ type, scheme }: SecurityScheme) => scheme === 'bearer' && type === 'http',
  handle: bearerHandler.bind({}, 'Bearer'),
};

const oauth2 = {
  test: ({ type }: SecurityScheme) => type === 'oauth2',
  handle: bearerHandler.bind({}, 'OAuth2'),
};

const apiKeyInCookie = {
  test: ({ type, in: where }: SecurityScheme) => where === 'cookie' && type === 'apiKey',
  handle: <R, I>(someInput: I, name: string, resource?: R) => {
    const probablyCookie = get(someInput, ['headers', 'cookie']);

    const isApiKeyInCookie = pipe(
      fromNullable(probablyCookie),
      mapNullable(cookie => new RegExp(`${name}=.+`).test(cookie)),
      getOrElse(() => false),
    );

    return when<R>(isApiKeyInCookie, `Cookie realm="*" cookie-name=${name}`, resource);
  },
};

function when<R>(isOk: boolean, msg: string, resource?: R) {
  return isOk ? Either.right(resource) : Either.left(genUnauthorisedErr(msg));
}

function isBearerToken(inputHeaders: Headers) {
  return pipe(
    fromNullable(inputHeaders.authorization),
    mapNullable(authorization => !!authorization.match(/^Bearer\s.+$/)),
    getOrElse(() => false),
  );
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
