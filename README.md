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
npm install -g @stoplight/prism-cli
# or
yarn global add @stoplight/prism-cli
```

…or if you do not want to install [Node](https://nodejs.org), you can either use the installation script (if you're using Linux or MacOS)…

```
curl -L https://raw.githack.com/stoplightio/prism/master/install | sh
```

…or download the latest release from [GitHub directly][download-release]. We offer binaries for Windows as well.

## Usage

### CLI

We'll present here only the main use cases. For a complete overview of the CLI, you can consult the relevant [documentation ⇗][cli-docs].

#### Mock server

Running Prism on the CLI will create a HTTP mock server.

```bash
prism mock https://raw.githack.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
✔  success   Prism is listening on http://127.0.0.1:4010
●  note      GET        http://127.0.0.1:4010/pets
●  note      POST       http://127.0.0.1:4010/pets
●  note      GET        http://127.0.0.1:4010/pets/{id}
●  note      DELETE     http://127.0.0.1:4010/pets/{id}
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

#### Server Validation

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

## What's next for Prism?

- [x] Server Validation
- [x] Content Negotiation
- [ ] Security Validation
- [ ] Custom Mocking
- [ ] Validation Proxy
- [ ] Recording / "Learning" mode to create spec files
- [ ] Data Persistence (allow Prism act like a sandbox)

## Experimental programmatic APIs (advanced topic)

### HTTP Client

Prism's HTTP Client programmatic API lets you write custom code and build things like request makers and mocking servers (in fact Prism CLI uses the HTTP Client deep inside!).

You can find more details about this package in [its dedicated documentation](packages/http/README.md).

## FAQs

**Why am I getting 404 errors when I include my basePath?**

OpenAPI v2.0 had a concept called "basePath", which was essentially part of the HTTP path the stuff
after host name and protocol, and before query string. Unlike the paths in your `paths` object, this
basePath was applied to every single URL, so Prism v2.x used to do the same. In OpenAPI v3.0 they
merged the basePath concept in with the server.url, and Prism v3 has done the same.

We treat OAS2 `host + basePath` the same as OAS3 `server.url`, so we do not require them to go in
the URL. If you have a base path of `api/v1` and your path is defined as `hello`, then a request to
`http://localhost:4010/hello` would work, but `http://localhost:4010/api/v1/hello` will fail. This
confuses some, but the other way was confusing to others. Check the default output of Prism CLI to
see what URLs you have available.

**How can I debug Prism?**

Check out our [debugging section ⇗][debugging] in the [contribution docs ⇗][contributing].

## Contributing

If you are interested in contributing to Prism itself, check out our [contributing docs ⇗][contributing] and [code of conduct ⇗][code_of_conduct] to get started.

[code_of_conduct]: CODE_OF_CONDUCT.md
[contributing]: CONTRIBUTING.md
[debugging]: CONTRIBUTING.md#debugging
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
[http-docs]: packages/http/README.md
