# Prism Client

Prism includes a fully-featured HTTP Client that you can use to seamlessly perform requests to both a real server and a mocked document. The client is modeled after Axios so it may feel familiar.

### Create From Manual HTTP Operations

```ts
const createClientFromOperations = require('@stoplight/prism-http/dist/client');

const client = createClientFromOperations(
  [
    {
      method: 'get',
      path: '/hello',
      id: 'n1',
      responses: [{ code: '200' }],
    },
  ],
  { mock: true, validateRequest: true, validateResponse: true }
);
```

To create the required operations array you can use two utility functions defined in the `@stoplight/prism-cli` package:

### Create from file or HTTP resource

```ts
const { getHttpOperationsFromSpec, getHttpOperationsFromResource } = require('@stoplight/prism-cli/dist/operations');

const operations = await getHttpOperationsFromResource('examples/petstore.oas2.yaml');

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
```

---

Once you've got a client instance:

1. You can perform the request using the generic method:

```ts
client.request('https://google.it', { method: 'get' }).then(response => console.log(response));
```

The response object has all the information you need, including the used configuration object.

2. You can override the configuration object on the request level if you prefer

```ts
client
  .request('https://google.it', { method: 'get' }, { validateResponse: false })
  .then(response => console.log(response));
```

This disables response validation _only for the current request_

3. You can do the same thing using the shortcut methods

```ts
client.get('https://google.it', { mock: false }).then(response => console.log(response));
```

For the shortcut methods (since the only mandatory option is intrinsic in the function name) the option parameter can be omitted

```ts
client.get('https://google.it', { validateRequest: false }).then(response => console.log(response));
```

You can also use relative links when doing requests. In such case you won't be able to use the proxy and the server validation will be disabled:

```ts
client.get('/users/10', { validateRequest: false }).then(response => console.log(response));
```

…or you can also set the base path in the options object:

```ts
client.get('/users/10', { baseUrl: 'https://api.stoplight.io/' }).then(response => console.log(response));
```
