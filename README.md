# Prism

<a href="https://codeclimate.com/github/stoplightio/prism/test_coverage"><img src="https://api.codeclimate.com/v1/badges/f5e363a7eb5b8f4e570f/test_coverage" /></a>

Prism is a set of packages for API mocking with **OpenAPI Specification v2** (formerly known as Swagger Specification) and **OpenAPI Specification v3**.

For example, given an API specification:

- You can spin up a mock HTTP server and respond realistically based on your requests

The set of packages are made up of:

- [`core`][core]: basic interfaces and abstraction for API descriptions
- [`http`][http]: A Prism implementation to work with HTTP Requests
- [`http-server`][http-server]: A _[Fastify]_ instance that uses Prism to validate/mock/respond and forward to http requests
- [`cli`][cli]: A CLI to spin up servers locally easily

Look at the relative repositories' READMEs for the specific documentation.

> Note: This branch refers to Prism 3.x, which is the current version most likely you will use. If you're looking for the 2.x version, point your browser to the [2.x branch][2.x]

## Installation

Most of the users will probably want to use the CLI, which is a Node module, and can either be installed via NPM or Yarn…

```bash
npm install -g @stoplight/prism-cli@alpha
# or
yarn global add @stoplight/prism-cli@alpha
```

…or if you do not want to install [Node](https://nodejs.org), you can download the latest release from [GitHub directly][download-release]

## Usage

### CLI

We'll present here only the main use cases. For a complete overview of the CLI, you can consult the relevant [documentation][cli-docs].

#### Mock server

Running Prism on the CLI will create a HTTP mock server.

```bash
prism mock https://raw.githack.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
> http://127.0.0.1:4010
```

Then in another tab, you can hit the HTTP server with your favorite HTTP client.

```bash
curl -s -D "/dev/stderr" http://127.0.0.1:4010/pets/123 | json_pp
HTTP/1.1 200 OK
content-type: application/json
content-length: 85
Date: Thu, 09 May 2019 15:25:40 GMT
Connection: keep-alive

{
   "tag" : "proident et ",
   "id" : -66955049,
   "name" : "ut consectetur cillum sit exercitation"
}
```

Responses will be mocked using realistic data that conforms to the type in the description.

#### Determine Response Status

Prism can be forced to return different HTTP responses by specifying the status code in the query
string:

```bash
curl -v http://127.0.0.1:4010/pets/123?__code=404

HTTP/1.1 404 Not Found
content-type: application/json
content-length: 52
Date: Thu, 09 May 2019 15:26:07 GMT
Connection: keep-alive
```

The body, headers, etc. for this response will be taken from the API description document.

#### Request Validation

Requests to operations which expect a request body will be validated, for example: a POST with JSON.

```bash
curl -X POST -s -D "/dev/stderr" -H "content-type: application/json" -d '{"tag":"Stowford"}' http://127.0.0.1:4010/pets | json_pp
```

This will generate an error, conforming the [application/problem+json][rfc7807] specification:

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json
content-length: 274
Date: Thu, 09 May 2019 16:36:38 GMT
Connection: keep-alive

{
   "detail" : "Your request body is not valid: [{\"path\":[\"body\"],\"code\":\"required\",\"message\":\"should have required property 'name'\",\"severity\":0}]",
   "type" : "https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY",
   "title" : "Invalid request body payload",
   "status" : 422
}
```

This error shows the request is missing a required property `name` from the HTTP request body.

## What's next for Prism?

- [ ] Server Validation
- [ ] Accept header validation
- [ ] Content header validation
- [ ] Security Validation
- [ ] Dynamic Mocking (use JS to script custom interactions)
- [ ] Forwarding proxy with validation
- [ ] Recording traffic to spec file
- [ ] Data Persistence (turn Prism into a sandbox server)
- [ ] Support files ending with `.yml` and extension-less files

## FAQs

Base paths are completely ignored by the Prism HTTP server, so they can be removed from the request.
If you have a base path of `/api` and your path is defined as `hello`, then a request to
`http://localhost:4010/hello` would work, but `http://localhost:4010/api/hello` will fail.

## Contributing

If you are interested in contributing to Prism itself, check out our [contributing docs][contributing] and [code of conduct][code_of_conduct] to get started.

[code_of_conduct]: CODE_OF_CONDUCT.md
[contributing]: CONTRIBUTING.md
[fastify]: https://www.fastify.io/
[graphite]: https://github.com/stoplightio/graphite
[download-release]: https://github.com/stoplightio/prism/releases/latest
[rfc7807]: https://tools.ietf.org/html/rfc7807
[core]: https://www.npmjs.com/package/@stoplight/prism-core
[http]: https://www.npmjs.com/package/@stoplight/prism-http
[http-server]: https://www.npmjs.com/package/@stoplight/prism-http-server
[cli]: https://www.npmjs.com/package/@stoplight/prism-cli
[2.x]: https://github.com/stoplightio/prism/tree/2.x
[cli-docs]: packages/cli/README.md
