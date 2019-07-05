# Prism

[![Build Status](https://dev.azure.com/vncz/vncz/_apis/build/status/stoplightio.prism?branchName=master)](https://dev.azure.com/vncz/vncz/_build/latest?definitionId=1&branchName=master)
[![CircleCI](https://circleci.com/gh/stoplightio/prism.svg?style=svg)](https://circleci.com/gh/stoplightio/prism)

Prism is a set of packages for API mocking with **OpenAPI Specification v2** (formerly known as Swagger Specification) and **OpenAPI Specification v3**.

For example, given an API specification you can spin up a mock HTTP server and respond realistically based on your requests

![Demo of Prism Mock Server being called with curl from the CLI](./examples/prism-cli.svg)

The set of packages are made up of:

- [`core`][core]: basic interfaces and abstraction for API descriptions
- [`http`][http]: A Prism implementation to work with HTTP Requests
- [`http-server`][http-server]: A _[Fastify]_ instance that uses Prism to validate/mock/respond to http requests
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

Please check out our `docs` directory. A good point to start is the [CLI section][cli-docs]

### Docker Image

Prism is avaiable as Docker Image as well under the `3` tag.

`docker run -P stoplight/prism:3 mock -h 0.0.0.0 api.oas2.yml`

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

## Prism Decision Flow Diagram

In case you're interested in all logical decision we make to figure out the best HTTP response to the specific request, you can consult our [diagram](./packages/http/docs/images/mock-server-dfd.png)

[code_of_conduct]: CODE_OF_CONDUCT.md
[contributing]: CONTRIBUTING.md
[debugging]: CONTRIBUTING.md#debugging
[fastify]: https://www.fastify.io/
[download-release]: https://github.com/stoplightio/prism/releases/latest
[core]: https://www.npmjs.com/package/@stoplight/prism-core
[http]: https://www.npmjs.com/package/@stoplight/prism-http
[http-server]: https://www.npmjs.com/package/@stoplight/prism-http-server
[cli]: https://www.npmjs.com/package/@stoplight/prism-cli
[cli-docs]: ./docs/cli.md
[2.x]: https://github.com/stoplightio/prism/tree/2.x
[http-docs]: packages/http/README.md
