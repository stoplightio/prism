# Prism HTTP

This package provides HTTP APIs for forwarding and mocking requests.

## HTTP Forwarder

> Note: The current API is still experimental - changes can be introduced in future.

Module used to forward provided request. Is exposes single `forward` method and can be initialized with `IHttpOperation` and `IHttpRequest`.

### Forwarder props

Object containing:

- `resource` containing `IHttpOperation` _(optional)_
- `input` `IHttpRequest` wrapped with `IPrismInput`
- `timeout` overrides default timeout _(optional)_
- `cancelToken` cancellation token _(optional)_

Properties used from `resource: IHttpOperation`:

- `servers[]` - if not empty the first element will be used as server url

The type of `input` parameter `IPrismInput<IHttpRequest>` is defined as:

```ts
interface IPrismInput<IHttpRequest> {
  data: IHttpRequest;
  validations: {
    input: IPrismDiagnostic[];
```

Validations are not supported at the moment for Http Forwarder.

If both `resource` and `input` parameters are provided then server url is taken from the `resource`

### Usage example

```ts
import { forwarder } from '@stoplight/prism-http/lib/forwarder';

try {
  const data = await forwarder.forward({
    input: {
      data: {
        url: {
          baseUrl: 'https://example.com',
          path: '/v1',
        },
        method: 'post' as IHttpMethod,
        body: '{}',
        headers: {
          headerName: 'headerValue',
        },
      },
      validations: {
        input: [],
      },
    },
    timeout: 1000,
  });
} catch (ex) {}
```

### Using variables

API supports variables included in `IHttpOperation` servers.
Examples:

```json
{
  "servers": [
    {
      "url": "http://{var1}.example.com",
      "variables": {
        "var1": {
          "default": "api"
        }
      }
    }
  ]
}
```

If no default value - first element will be used:

```json
{
  "servers": [
    {
      "url": "http://{var1}.example.com",
      "variables": {
        "var1": {
          "enum": ["api", "api2"]
        }
      }
    }
  ]
}
```

### Using cancellation token

```ts
import { CancelToken, forwarder } from '@stoplight/prism-http/lib/forwarder';

const cancelTokenSource = CancelToken.source();
try {
  const data = await forwarder.forward({
    input: {
      data: request,
      validations: {
        input: [],
      },
    },
    cancelToken: cancelTokenSource.token,
  });
} catch (ex) {}
```

### Headers manipulation

If provided request object contains `Host` header it will be replaced with `baseUrl` host. The original value will be set to `Forwarded` header with `host=` prefix.

## HTTP Mocker

Module used to generate mocked responses for provided operation definition and corresponding request. It exposes single `mock` method that is initialized with `IHttpOperation` and `IHttpRequest`.

### Initialization

Mocker is initialized with generator function that will be used for dynamic example generation.

```ts
import * as jsf from '@stoplight/json-schema-faker';
import { cloneDeep } from 'lodash';

async function generate(source: unknown): Promise<unknown> {
  return jsf.resolve(cloneDeep(source));
}

const mocker = new HttpMocker(generate);
```

### Mock props

Object containing:

- `resource` containing `IHttpOperation` providing operation definition with schemas and examples to mock
- `input` containing `IHttpRequest` wrapped with `IPrismInput` which is used against provided `resource` as input request
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

#### Negotiation process

Given provided resource (being http operation definition) and http request Prism runs that request against http operation trying to find the best suitable response following negotiation rules. Those rules can be extended by a config object containing specific values that have to match the operation.

1. Find response by code (if provided) or find the lowest 2xx response.
2. Find content by provided media type or use default media type if it is not provided or content for that media type does not exist.
3. Find example using provided `exampleKey` and `dynamic` values in following order:
   3.1. If `exampleKey` is provided and it exists for that response and media type return response with example value matching example key.
   3.2. If `dynamic` is set to `true` use schema to generate dynamic example.
   3.3. Try to find static example.
   3.4. Try to generate dynamic example.
   3.5. Return response with no body.

### Usage example

```ts
import { HttpMocker } from '@stoplight/prism-http/lib/mocker';

const mocker = new HttpMocker(generate);
const response = await mocker.mock({
  resource: httpOperation,
  input: httpRequest,
  config: {
    mock: {
      dynamic: false,
      code: '201',
      exampleKey: 'second',
      mediaTypes: ['application/xml'],
    },
  },
});
```
