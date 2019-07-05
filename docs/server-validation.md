# Server Validation

OpenAPI lets API spec authors make only certain servers available, and they also allow certain
operations to be restricted to certain servers. Make sure the server URL you plan to use is a valid
server this the particular operation you are attempting. by providing a `__server` query param.

Take this minimalist spec (OpenAPI v3) example:

```yaml
openapi: 3.0.2
paths:
  '/pet':
    get:
      responses:
        '200':
          content:
            '*/*':
              schema:
                type: string
                example: hello world
servers:
  - url: https://stoplight.io/api
    name: Production
  - url: https://stag.stoplight.io/api
    name: Staging
```

You can make a request enforcing server validation by providing the `__server` query string parameter:

```bash
curl http://localhost:4010/pet?__server=https://stoplight.io/api
hello world
```

On the other hand, putting a server which is not defined in the specification, for example:

```bash
curl http://localhost:4010/pet?__server=https://nonsense.com/api
```

Will give you the following error:

```json
{
  "type": "https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR",
  "title": "Route not resolved, no server matched.",
  "status": 404,
  "detail": "The server url http://nonsense.com/api hasn't been matched with any of the provided servers"
}
```
