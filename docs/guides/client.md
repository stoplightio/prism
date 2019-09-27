# Prism Client

Prism includes a fully-featured HTTP Client that you can use to seamlessly perform requests to both a real server and a mocked document. The client is modeled after Axios so it may feel familiar.

### Create from a filename or http resource

```ts
const client = await createClientFromResource('examples/petstore.oas2.yaml', {
  mock: true,
  validateRequest: true,
  validateResponse: true,
});
```

### Create from OpenAPI string

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

const client = await createClientFromString(descriptionDoc, {
  mock: true,
  validateRequest: true,
  validateResponse: true,
});
```

### Create From Manual Http Operations

```ts
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
