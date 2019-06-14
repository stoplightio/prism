# Prism HTTP

This package provides HTTP APIs for forwarding and mocking requests.

## HTTP Forwarder

> Note: The current API is still experimental - changes can be introduced in future.

Module used to forward provided request. Is exposes single `forward` method and can be initialized with `IHttpOperation` and `IHttpRequest`.

### Forwarder props

`opts` object containing:

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
