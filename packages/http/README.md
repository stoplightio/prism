# Http Client

This package provides a http client featuring the ability to:

- mock requests instead of hitting the server
- validate the request and the response according to an openapi spec

The goal of this document is to provide you with some basic code examples to get you started and to cover some of the advanced scenarios.

# Installation

`yarn add @stoplight/prism-http`

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

## I want to mock responses of operations defined in an OAS file

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

## I want to make a http request a server

In this use case we assume we have a server running at `http://localhost:4010`
that is able to handle `GET /todos` request.

We don't want to mock a reqeust, we simply want to make the request, hit the actual server and get the response back.

```javascript
const Prism = require('@stoplight/prism-http');

// Create Prism instance and configure it to make http requests (mock: false)
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

## I want all my requests to talk to a server unless I override it per a reqeust

In the following example we will first instantiate Prism to make requests to an actual server.

Later we alter than behaviour by passing a config object to the `process` function.

```javascript
const Prism = require('@stoplight/prism-http');
const path = require('path');

// Note that by default we don't want to mock responses
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
        // We can override the default behaviour per request.
        mock: {
          dynamic: true,
        },
      }
    );
  })
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

# Even more advanced stuff for the hardcore nerds :)

Some say that unit tests and integration tests are the best documentation.

We keep our test coverage pretty solid so feel free to explore the `__tests__` folder to find out more about the API.

For those of you who're just intersted in the API layer I'd recommend checking out the [http-prism-instance.spec.ts] file which covers a great deal of functional cases.
