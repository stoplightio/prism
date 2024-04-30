# HTTP Client

This package provides a HTTP client featuring the ability to:

- mock responses based of OpenAPI spec
- make requests to a HTTP server
- validate the request and/or the response according to the provided OpenAPI Specification file

In essence it's an HTTP client with the ability to mock responses and validate requests.

The goal of this document is to provide you with some basic code examples to get you started and to cover some of the advanced scenarios.

## Important

If you're a regular user and not a PRO, you might to want to use the [User facing client](../../docs/guides/07-http-client.md) which provides a better an higher lever API

# Table of Contents

- [Installation](#installation)
- [Basic Usages](#basic-usages)
  - [Mock All Responses](#mock-all-responses)
  - [Mock Single Response](#mock-single-response)
  - [Make Request To An Upstream Server](#make-request-to-an-upstream-server)
- [Advanced Topics](#advanced-topics)
  - [Creating Prism Instance](#creating-prism-instance)
    - [Config Object](#config-object)
      - [Config Examples](#config-examples)
  - [Loading specs](#loading-specs)
  - [Making requests](#making-requests)
    - [Server Validation](#server-validation)
  - [Understanding response](#understanding-response)
  - [Prism Decision Flow Diagram](#prism-decision-flow-diagram)

# Installation

```bash
yarn add @stoplight/prism-http
```

# Basic Usages

> Note: the examples in this document use the following spec

```yaml
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
          content:
            'text/plain':
              example: Write great OpenAPI specs!
```

## Mock All Responses

```javascript
const Prism = require('@stoplight/prism-http');

// Create Prism instance and configure it as a mocker generating static examples
const prism = Prism.createInstance({
  mock: { dynamic: false },
  validate: { request: { query: true } },
});

// Make a "GET /todos" request
return prism.request(
  {
    method: 'get',
    url: {
      path: '/todos',
    },
    headers: {
      Accept: 'text/plain',
    },
  },
  operations
);
```

Output

```bash
{
  statusCode: 200,
  headers: { 'Content-type': 'text/plain' },
  body: 'Write great OpenAPI specs!'
}
```

Note: the `request` method returns a [`TaskEither` monad](https://gcanti.github.io/fp-ts/modules/TaskEither.ts.html). So in case you want to extract the result, you're going to need to use the [pipe](https://gcanti.github.io/fp-ts/modules/function.ts.html#pipe) function.

```ts
return pipe(
  prism.request(
    {
      method: 'get',
      url: {
        path: '/todos',
      },
      headers: {
        Accept: 'text/plain',
      },
    },
    operations
  ),
  TE.fold(console.error, console.log)
)(); // returns a Promise
```

## Mock Single Response

In the following example we will first instantiate Prism to make requests to an actual server.

Later we alter than behaviour by passing a config object to the `request` function.

```javascript
const Prism = require('@stoplight/prism-http');

// Note that by default we don't want to mock responses
const prism = Prism.createInstance({ mock: { dynamic: false } });

// Make a "GET /todos" request
return prism.request(
  {
    method: 'get',
    url: {
      path: '/facts',
      baseUrl: 'https://cat-fact.herokuapp.com',
    },
  },
  {
    // We can override the default behaviour per request.
    mock: {
      dynamic: true,
    },
  },
  operations
);
```

## Make Request To An Upstream Server

We don't want to mock a reqeust, we simply want to make the request, hit the actual server and get the response back.

```javascript
const Prism = require('@stoplight/prism-http');

// Create Prism instance and configure it to make HTTP requests (mock: {dynamic: false})
const config = { mock: { dynamic: false } };
const prism = Prism.createInstance(config);

return prism.request({
  method: 'get',
  url: {
    path: '/facts',
    baseUrl: 'https://cat-fact.herokuapp.com',
  },
});
```

In response you'll get some... facts about cats. For example:

> Cats aren’t the only animals that purr — squirrels, lemurs, elephants, and even gorillas purr too.

:)

# Advanced Topics

## Creating Prism Instance

In order to create and instance of HTTP Client (later referred to as `prism` for simplicity) use the `createInstance` function, like so:

```javascript
const Prism = require('@stoplight/prism-http');
const config = { mock: { dynamic: false } };
const prism = Prism.createInstance(config /*, components */);
```

There are two (both optional) arguments you can supply `createInstance` with:

- config (of `IHttpConfig` type)
- components (of `PrismHttpComponents` type)

We will cover the `config` argument in next section and we'll leave `components` for some other time (overriding default `components` is the _ultimate advanced stuff_).

### Config Object

Prism's config object (`IHttpConfig`) allows you to manipulate Prism's behaviour in many ways. For instance:

- turn validation on and off
- influence Prism's mocked response generation strategy

The actual interface looks like this (but rather than explain each property we're going to look at some examples)

```ts
export interface IHttpConfig extends IPrismConfig {
  mock: { dynamic: false } | IHttpOperationConfig;
  validateRequest: boolean;
  validateResponse: boolean;
  checkSecurity: boolean;
  errors: boolean;
}
```

#### Config Examples

**When mocking a response generate static response**

```javascript
const config = {
  mock: {
    dynamic: false,
  },
};
```

Generating static responses means that if an OpenAPI operation's response has any examples defined the payload we construct will use those examples.

This contrasts "dynamic responses" which means generating responses from a json schema.

**Return named example of a specified key**

```javascript
const config = {
  mock: {
    exampleKey: 'key',
  },
};
```

In OpenAPI Specification 3 one can construct such response that will have multiple examples mapped by keys.
This configuration allows you to be very specific which example you want to choose.

**Return 403 response of specified mime type**

```javascript
const config = {
  mock: {
    code: 403,
    mediaTypes: ['application/xml'],
  },
};
```

This will enforce a 403 response (given that such response is defined in your OpenAPI file).

## Loading specs

The Http package does not have any pre-canned loader for the specification files. You need to feed it with an array of operations that can be used for the request/response cycle.

You can find an example by looking at the [operations.ts](../cli/src/operations.ts) file in the CLI package.

## Making requests

To make a basic request you need to do the following

```javascript
const request = {
  method: 'get',
  url: {
    path: '/path', // must be prefixed with slash
  },
};
const promise = prism.request(request, operations);
```

The request object has the following interface

```ts
export interface IHttpRequest {
  method: HttpMethod;
  url: IHttpUrl;
  headers?: IHttpNameValue;
  body?: unknown;
}
```

All of this is pretty standard except the `url.baseUrl` which we will describe in more details.

### Server Validation

Consider a request

```javascript
prism.request(
  {
    method: 'get',
    url: {
      path: '/facts', // must be prefixed with slash
      baseUrl: 'https://cat-fact.herokuapp.com',
    },
  },
  operations
);
```

Notice that `baseUrl` is defined.

This will instruct Prism to do one of the two:

- if mocking is **disabled** (`{ mock: {dynamic: false} }`)
  - it will use that `baseUrl` to make a request to the server (`GET https://cat-fact.herokuapp.com/facts`)
  - it will **verify** whether the provided `baseUrl` matches any of the servers defined in your OpenAPI and **add an input warning to the .request return value if it is not valid**
- if mocking is **enabled**
  - it will **verify** whether the provided `baseUrl` matches any of the servers defined in your OpenAPI and **return an error if it is not valid**

## Understanding response

The `prism.request` resolved (it's a Promise!) value consists of:

- input - copy of the request object you provided
- output - the HTTP response
- validations
  - input - list of warnings/errors related to you http request object
  - output - list of warnings/errors related to you http response object

Validations are still subject of tests and experimentation therefore we will not cover them fully for the time being.

One example however is that for a given example

```javascript
const Prism = require('@stoplight/prism-http');

// Create Prism instance and configure it to make http requests
const config = { mock: { dynamic: false } };
const prism = Prism.createInstance(config);
prism.request(
  {
    method: 'get',
    url: {
      path: '/facts',
      baseUrl: 'https://cat-fact.herokuapp.com',
    },
  },
  operations
);
```

You would get this in response

```bash
[
  {
    message: 'Route not resolved, no resource provided.',
    source: 'NO_RESOURCE_PROVIDED_ERROR',
    code: 404,
    severity: 1
  }
]
```

## Prism Decision Flow Diagram

The below diagram represents all logical decision we make to figure out the best HTTP response to the specific request.

![Decision Flow Diagram](./docs/images/mock-server-dfd.jpeg)
