import * as Either from 'fp-ts/lib/Either';
import { fromNullable, getOrElse, mapNullable } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { get } from 'lodash';

const unauthorisedErr = (msg: string) => ({
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
  test: ({ scheme, type }: any) => {
    return scheme === 'basic' && type === 'http';
  },
  handle: (someInput: any, resource: any) => {
    const authorizationHeader = get(someInput, ['headers', 'authorization'], '');

    return authorizationHeader
      ? checkHeader(authorizationHeader, resource)
      : Either.left(unauthorisedErr('Basic realm="*"'));
  },
};

function checkHeader(authorizationHeader: string, resource: any) {
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
  test: ({ type, in: where }: any) => {
    return where === 'header' && type === 'apiKey';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    const isAPIKeyProvided = pipe(
      fromNullable(someInput.headers),
      mapNullable(headers => headers[definedSecSchema.name.toLowerCase()]),
      getOrElse(() => false),
    );

    return when(isAPIKeyProvided, resource, definedSecSchema.name);
  },
};

const apiKeyInQuery = {
  test: ({ type, in: where }: any) => {
    return where === 'query' && type === 'apiKey';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    const isApiKeyInQuery = !!someInput.url.query[definedSecSchema.name];

    return when(isApiKeyInQuery, resource, definedSecSchema.name);
  },
};

const openIdConnect = {
  test: ({ type }: any) => {
    return type === 'openIdConnect';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    return when(isBearerToken(someInput), resource, definedSecSchema.name);
  },
};

const bearer = {
  test: ({ type, scheme }: any) => {
    return scheme === 'bearer' && type === 'http';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    return when(isBearerToken(someInput), resource, definedSecSchema.name);
  },
};

const oauth2 = {
  test: ({ type }: { type: string }) => {
    return type === 'oauth2';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    return when(isBearerToken(someInput), resource, definedSecSchema.name);
  },
};

const apiKeyInCookie = {
  test: ({ type, in: where }: any) => {
    return where === 'cookie' && type === 'apiKey';
  },
  handle: (someInput: any, resource: any, definedSecSchema: any) => {
    const isApiKeyInCookie = pipe(
      fromNullable(someInput.headers),
      mapNullable(headers => headers.cookie),
      mapNullable(cookie => {
        return new RegExp(`${definedSecSchema.name}=.+`).test(cookie);
      }),
      getOrElse(() => false),
    );

    return when(isApiKeyInCookie, resource, `Cookie realm="*" cookie-name=${definedSecSchema.name}`);
  },
};

function when(isOk: any, resource: any, msg: any) {
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

function isBearerToken(someInput: any) {
  return pipe(
    fromNullable(someInput.headers),
    mapNullable(headers => headers.authorization),
    mapNullable(authorization => {
      return !!authorization.match(/^Bearer\s.+$/);
    }),
    getOrElse(() => false),
  );
}
