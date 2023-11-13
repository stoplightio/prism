# Prism Client

Prism includes a HTTP Client that you can use to request data to both a real server or a mocked document. The client is modeled after Axios so it may feel familiar.

## Create Client from File

Use the `getHttpOperationsFromSpec` method defined in the `@stoplight/prism-cli` package to create the required operations array from an OpenAPI spec:

```ts
const { getHttpOperationsFromSpec } = require('@stoplight/prism-cli/dist/operations');
const { createClientFromOperations } = require('@stoplight/prism-http/dist/client');
const { URL } = require('url');

const operations = await getHttpOperationsFromSpec('examples/petstore.oas2.yaml');
const client = createClientFromOperations(operations, {
  mock: { dynamic: false },
  validateRequest: true,
  validateResponse: true,
  checkSecurity: false,
  errors: true,
  upstream: new URL('https://api.example.com'),
  upstreamProxy: undefined,
  isProxy: true,
});
```

The `getHttpOperationsFromSpec` method also receives the spec as a string:

```ts
const descriptionDoc = `
openapi: 3.0.2
paths:
  /hello:
    get:
      responses:
        200:
          description: hello
`;

const operations = await getHttpOperationsFromSpec(descriptionDoc);

...
```

## Create Client from Manual HTTP Operations

```ts
const { createClientFromOperations } = require('@stoplight/prism-http/dist/client');
const { URL } = require('url');

const client = createClientFromOperations(
  [
    {
      method: 'get',
      path: '/hello',
      id: 'n1',
      responses: [{ code: '200' }],
    },
  ],
  {
    mock: { dynamic: false },
    validateRequest: true,
    validateResponse: true,
    checkSecurity: false,
    errors: true,
    upstream: new URL('https://api.example.com'),
    upstreamProxy: undefined,
    isProxy: true,
  }
);
```

---

## Example usages

Once you've got a client instance:

### Request using the generic method:

```ts
client.request('https://google.it', { method: 'get' }).then(console.log);
```

The response object has all the information you need, including the used configuration object.

### Override the configuration object on the request level

```ts
const config = { validateResponse: false };
client.request('https://google.it', { method: 'get' }, config).then(console.log);
```

This disables response validation _only for the current request_

You can do the same thing using the shortcut methods

```ts
client.get('https://google.it', { mock: { dynamic: false } }).then(console.log);
```

For the shortcut methods (since the only mandatory option is intrinsic in the function name) the option parameter can be omitted

```ts
client.get('https://google.it', { validateRequest: false }).then(console.log);
```

You can also use relative links when doing requests. In such case you won't be able to use the proxy and the server validation will be disabled:

```ts
client.get('/users/10', { validateRequest: false }).then(console.log);
```

…or you can also set the base path in the options object:

```ts
client.get('/users/10', { baseUrl: 'https://api.stoplight.io/' }).then(console.log);
```

### Set mocking options

```ts
client.request('https://google.it', { method: 'get' }, { mock: { dynamic: true } }).then(console.log);
client
  .request('https://google.it', { method: 'get' }, { isProxy: true, upstream: new URL('https://api.example.com') })
  .then(console.log);
```
