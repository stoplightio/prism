# Prism HTTP

This package provides a http client featuring the ability to:

- mock requests instead of hitting the server
- validate the request and the response according to an openapi spec

# Basic Usages

> Note: examples in this document use the following spec

```yaml
---
openapi: 3.0.2
paths:
  /todos:
    get:
      parameters:
        - name: title
          in: query
          style: form
          schema:
            enum:
              - eat
              - drink
      responses:
        200:
          description: Get Todo Items
```

## I want to use Prism to mock responses

[Try it!](https://repl.it/@ChrisMiaskowski/prism-http-client-basic-mocking);

```javascript
const Prism = require('@stoplight/prism-http');
const path = require('path');

// Create Prism instance and configure it as a mocker generating static examples
const config = { mock: { dynamic: false } };
const prism = Prism.createInstance(config);

// Load openapi spec file
const specPath = path.resolve(process.cwd(), 'basic.oas3.yaml');
prism
  .load({ path: specPath })
  .then(() => {
    // Make a "GET /todos" request
    return prism.process({
      method: 'get',
      url: {
        path: '/todos',
      },
    });
  })
  .then(prismResponse => {
    console.log(prismResponse.output);
  });
```

Output

```bash
{ statusCode: 200,
  headers: { 'Content-type': 'text/plain' },
  body: undefined }
```

## I want Prism to make a http request a server

In this use case we assume we have a server running at `http://localhost:4010`
that is able to handle `GET /todos` request.

We don't want to mock a reqeust, we simply wan to make the request, hit the actual server and get the response back.

```javascript
const Prism = require('@stoplight/prism-http');

// Create Prism instance and configure it to make http requests
const config = { mock: false };
const prism = Prism.createInstance(config);
prism
  .process({
    method: 'get',
    url: {
      path: '/todos',
      baseUrl: 'http://localhost:4010',
    },
  })
  .then(prismResponse => {
    console.log(prismResponse.output);
  });
```

In response you'll get whatever the server responds with.

## I want to override Prism's config for a single request

In the following example we will first instantiate Prism to make requests to an actual server.

Later we alter than behaviour by passing a config object to the `process` function.

```javascript
const Prism = require('@stoplight/prism-http');
const path = require('path');

const prism = Prism.createInstance({ mock: false });
const specPath = path.resolve(process.cwd(), 'basic.oas3.yaml');

prism
  .load({ path: specPath })
  .then(() => {
    // Make a "GET /todos" request
    return prism.process(
      {
        method: 'get',
        url: {
          path: '/todos',
          baseUrl: 'http://localhost:4010',
        },
      },
      {
        // we force prism to mock the response instead of hit the server
        mock: {
          dynamic: true,
        },
      }
    );
  })
  .catch(e => console.error(e))
  .then(prismResponse => {
    console.log(prismResponse.output);
  });
```

# Advanced Topics

TBD...

- Describe `load`, `process` and `createInstance`
- Describe the config object
- describe `validations`

### Initialization

- `config` configuration of `IHttpConfig` type overriding default behavior _(optional)_

#### Config property

`config` object contains `mock` property of type `false | IHttpOperationConfig` defined by:

```ts
interface IHttpOperationConfig {
  mediaTypes?: string[];
  code?: string;
  exampleKey?: string;
  dynamic: boolean;
}
```

`mediaTypes` - array of media types that need to match operation response
`code` - response code to match operation response
`exampleKey` - providing specific example key will only match examples with that key
`dynamic` - determines whether example should be static (taken from operation if there are any) or dynamically generated

##### Config example

```json
{
  "mock": {
    "dynamic": false,
    "code": "201",
    "exampleKey": "second",
    "mediaTypes": ["application/xml"]
  }
}
```

# Gotchas

If provided request object contains `Host` header it will be replaced with `baseUrl` host. The original value will be set to `Forwarded` header with `host=` prefix.
