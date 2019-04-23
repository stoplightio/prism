# Prism

<a href="https://codeclimate.com/github/stoplightio/prism/maintainability"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/maintainability" /></a>

<a href="https://codeclimate.com/github/stoplightio/prism/test_coverage"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/test_coverage" /></a>

Prism is a set of packages that, given an API description, can:

1. Spin up a mock HTTP server and respond realistically based on your requests
1. Validate requests passing through against the provided API description

Being based on [Graphite], Prism supports any description format that Graphite supports:

- OpenAPI v3.0
- OpenAPI v2.0 (formerly Swagger)

Prims is a multi-package repository:

- `core:` basic interfaces and abstraction for API descriptions
- `http:` A Prism implementation to work with HTTP Requests
- `http-server:` A _[Fastify]_ instance that uses Prism to validate/mock/respond and forward to http requests
- `cli:` A CLI to spin up servers locally easily

Look at the relative repositories' README for the specific documentation.

## Install

Prism is a Node module, and can be installed via NPM or Yarn:

```bash
npm install -g prism
# or
yarn global add prism
```

_*TODO:* Create an executable which will run without needing to install a node module._

## Usage

### Mock server

Running Prism on the CLI will create a HTTP mock server.

```bash
$ prism mock examples/petstore.oas3.json
> http://127.0.0.1:4010
```

Then in another tab, you can hit the HTTP server with your favorite HTTP client (like [HTTPie]):

```bash
$ http GET http://127.0.0.1:4010/pets/123

HTTP/1.1 200 OK
Connection: keep-alive
content-length: 98
content-type: application/json

{
    "category": {
        "id": -70254706,
        "name": "nostrud voluptate sit molli"
    },
    "id": 69856282,
    "name": "doggie",
    "photoUrls": [
        "esse aute elit",
        "sint Duis amet dolore",
        "eiusmod",
        "ea ",
        "anim sint"
    ],
    "status": "available"
}
```

Responses will be mocked using realistic data that conforms to the type in the description.

#### Determine Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the query
string:

```bash
http GET http://127.0.0.1:4010/pets/123?__code=404
```

The body, headers, etc. for this response will be taken from the API description document.

#### Request Validation

Requests to operations which expect a request body will be validated, for example: a POST with JSON.

```bash
http --json POST http://127.0.0.1:4010/pets name=Stowford
```

This will generate an error:

```
Here is the original validation result instead: [{"path":["body"],"name":"required","summary":"should have required property 'photoUrls'","message":"should have required property 'photoUrls'","severity":"error"}]
```

This error shows the request is missing the `photoUrls` property:

```bash
http --json POST http://127.0.0.1:4010/pets name=bar photoUrls:='["http://fdsf"]'
```

## FAQ

**The API description defines a base path of `/api` (using OpenAPI v2 `basePath` keyword, or in
OpenAPI v3 using a path in `servers.url`), but requests seem to fail when using it?**

Base paths are completely ignored by the Prism HTTP server, so they can be removed from the request.
If you have a base path of `/api` and your path is defined as `hello`, then a request to
`http://localhost:4010/hello` would work, but `http://localhost:4010/api/hello` will fail.

## TODO

- [ ] Server Validation
- [ ] Accept header validation
- [ ] Content header validation
- [ ] Security Validation
- [ ] Dynamic Mocking (use JS to script custom interactions)
- [ ] Forwarding proxy with validation
- [ ] Recording traffic to spec file
- [ ] Data Persistence (turn Prism into a sandbox server)

## Testing

```bash
yarn test
```

## Contributing

Please see [CONTRIBUTING] and [CODE_OF_CONDUCT] for details.

### Common issues

1. `jest --watch` throws ENOSPC error

- [optional] Install `watchman` as per [documentation](https://facebook.github.io/watchman/docs/install.html#installing-from-source)
- Modify `fs.inotify.max_user_watches` as per [issue resolution](https://github.com/facebook/jest/issues/3254)

[CODE_OF_CONDUCT]: CODE_OF_CONDUCT.md
[CONTRIBUTING]: CONTRIBUTING.md
[Fastify]: https://www.fastify.io/
[Graphite]: https://github.com/stoplightio/graphite
[HTTPie]: https://httpie.org/
