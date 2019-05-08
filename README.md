# Prism

<a href="https://codeclimate.com/github/stoplightio/prism/test_coverage"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/test_coverage" /></a>

Prism is a set of packages that, given an API description, can:

1. Spin up a mock HTTP server and respond realistically based on your requests
1. Validate requests passing through against the provided API description

**Note: this branch refers to Prism 3.x, which is the current version most likely you will use. If you're looing for the 2.x version, point your browser to the [right branch][2.x]**

Being based on [Graphite], Prism supports any description format that Graphite supports:

- OpenAPI v3.0
- OpenAPI v2.0 (formerly Swagger)

Prims is a multi-package repository:

- [`core:`][core] basic interfaces and abstraction for API descriptions
- [`http:`][http] A Prism implementation to work with HTTP Requests
- [`http-server:`][http-server] A _[Fastify]_ instance that uses Prism to validate/mock/respond and forward to http requests
- [`cli:`][cli] A CLI to spin up servers locally easily

Look at the relative repositories' README for the specific documentation.

## Install

Most of the users will probably want to use the CLI, which is a Node module, and can either be installed via NPM or Yarn…

```bash
npm install -g @stoplight/prism-cli
# or
yarn global add @stoplight/prism-cli
```

…or if you do not want to install [Node](https://nodejs.org), you can download the latest release from [GitHub directly][download-release]

## Usage

### CLI

We'll present here only the main use cases. For a complete overview of the CLI, you can consult the relevand [documentation][cli-docs]

#### Mock server

Running Prism on the CLI will create a HTTP mock server.

```bash
$ prism mock examples/petstore.oas3.json
> http://127.0.0.1:4010
```

Then in another tab, you can hit the HTTP server with your favorite HTTP client (like [HTTPie]):

```bash
$ curl -s -D "/dev/stderr" http://127.0.0.1:4010/pets/123 | json_pp

HTTP/1.1 200 OK
content-type: application/json
content-length: 440
Date: Wed, 08 May 2019 17:30:30 GMT
Connection: keep-alive

{
   "status" : "sold",
   "tags" : [
      {
         "name" : "labore occaecat officia deserunt",
         "id" : 75187907
      }
   ],
   "photoUrls" : [
      "nisi aute occaecat",
      "eiusmod sunt nostrud ut",
      "ipsum voluptate ",
      "magna irure est consectetur",
      "sunt quis laboris ut ex"
   ],
   "id" : 9427747,
   "category" : {
      "id" : 85199396,
      "name" : "in mollit labore D"
   },
   "name" : "doggie"
}
```

Responses will be mocked using realistic data that conforms to the type in the description.

#### Determine Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the query
string:

```bash
$ curl http://127.0.0.1:4010/pets/123?__code=404
```

The body, headers, etc. for this response will be taken from the API description document.

#### Request Validation

Requests to operations which expect a request body will be validated, for example: a POST with JSON.

```bash
curl -s -D "/dev/stderr" -H "content-type: application/json" -d '{"name":"Stowford"}' http://127.0.0.1:4010/pets?__code==405 | json_pp
```

This will generate an error, conforming the [application/problem+json][rfc7807] specification:

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json
content-length: 279
Date: Wed, 08 May 2019 19:22:27 GMT
Connection: keep-alive

{
   "title" : "Invalid request body payload",
   "detail" : "Your request body is not valid: [{\"path\":[\"body\"],\"code\":\"required\",\"message\":\"should have required property 'photoUrls'\",\"severity\":0}]",
   "status" : 422,
   "name" : "https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY"
}
```

This error shows the request is missing the `photoUrls` property:

## FAQ

**The API description defines a base path of `/api` (using OpenAPI v2 `basePath` keyword, or in
OpenAPI v3 using a path in `servers.url`), but requests seem to fail when using it?**

Base paths are completely ignored by the Prism HTTP server, so they can be removed from the request.
If you have a base path of `/api` and your path is defined as `hello`, then a request to
`http://localhost:4010/hello` would work, but `http://localhost:4010/api/hello` will fail.

## What's next for Prism?

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
[download-release]: https://github.com/stoplightio/prism/releases/latest
[rfc7807]: https://tools.ietf.org/html/rfc7807
[core]: https://www.npmjs.com/package/@stoplight/prism-core
[http]: https://www.npmjs.com/package/@stoplight/prism-http
[http-server]: https://www.npmjs.com/package/@stoplight/prism-http-server
[cli]: https://www.npmjs.com/package/@stoplight/prism-cli
[2.x]: https://github.com/stoplightio/prism/tree/2.x
[cli-docs]: packages/cli/README.md
