[![Prism - API Mock Servers and Contract Testing](./examples/readme-header.svg)][mocking_landing_page]

[![CircleCI][circle_ci_image]][circle_ci]
[![NPM Downloads][npm_image]][npm]
[![Buy us a tree][ecologi_image]][ecologi]

Prism is a set of packages for API mocking and contract testing with **OpenAPI v2** (formerly known as Swagger) and **OpenAPI v3.x**.

- **Mock Servers**: Life-like mock servers from any API Specification Document.
- **Validation Proxy**: Contract Testing for API Consumers and Developers.
- **Comprehensive API Specification Support**: OpenAPI 3.0, OpenAPI 2.0 (FKA Swagger) and Postman Collections support.

![Demo of Prism Mock Server being called with curl from the CLI](./examples/prism-cli.svg)

> Note: This branch refers to Prism 3.x, which is the current version most likely you will use. If you're looking for the 2.x version, look at the [`2.x` branch][2.x]

# Overview

- [Installation and Usage](#-installation-and-Usage)
- [Documentation and Community](#-documentation-and-community)
- [Roadmap](#-roadmap)
- [FAQs](#-faqs)
- [Contributing](#-contributing) 

## 🧰 Installation and Usage

**Installation**

*Prism requires NodeJS >= 12 to properly work.*
```bash
npm install -g @stoplight/prism-cli

# OR

yarn global add @stoplight/prism-cli
```


For more installation options, see our [installation documentation](./docs/getting-started/01-installation.md).

**Mocking**

```bash
prism mock https://raw.githack.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
```

**Validation Proxy**

```bash
prism proxy examples/petstore.oas2.yaml https://petstore.swagger.io/v2
```

## 📖 Documentation and Community

- [Documentation](https://meta.stoplight.io/docs/prism)
  - [Getting Started](./docs/getting-started/01-installation.md)
  - [Guides](./docs/guides/01-mocking.md)
- [Community](https://github.com/stoplightio/prism/discussions)

## 🚧 Roadmap

- [x] Content Negotiation
- [x] Security Validation
- [x] Validation Proxy
- [ ] Custom Mocking
- [ ] Recording / "Learning" mode to create spec files
- [ ] Data Persistence (allow Prism act like a sandbox)

## ❓ FAQs

**Cannot access mock server when using Docker?**

Prism uses localhost by default, which usually means 127.0.0.1. When using docker the mock server will
be unreachable outside of the container unless you run the mock command with `-h 0.0.0.0`.

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

**Is there a hosted version of Prism?**

Yes, hosted mocking is available as part of Stoplight Platform. [Learn More](https://stoplight.io/api-mocking?utm_source=github&utm_medium=prism&utm_campaign=readme) 

## ⚙️ Integrations

- [Stoplight Studio](https://stoplight.io/studio/?utm_source=github&utm_medium=prism&utm_campaign=readme): Free visual OpenAPI designer that comes integrated with mocking powered by Prism.
- [Stoplight Platform](https://stoplight.io/?utm_source=github&utm_medium=prism&utm_campaign=readme): Collaborative API Design Platform for designing, developing and documenting APIs with hosted mocking powered by Prism. 

## 🏁 Help Others Utilize Prism 

If you're using Prism for an interesting use case, [contact us](mailto:growth@stoplight.io) for a case study. We'll add it to a list here. Spread the goodness 🎉

## 👏 Contributing

If you are interested in contributing to Prism itself, check out our [contributing docs ⇗][contributing] and [code of conduct ⇗][code_of_conduct] to get started.

## 🎉 Thanks

Prism is built on top of lots of excellent packages, and here are a few we'd like to say a special thanks to.

- [ajv](https://www.npmjs.com/package/ajv)
- [faker](https://www.npmjs.com/package/faker)
- [fp-ts](https://www.npmjs.com/package/fp-ts)
- [gavel](https://www.npmjs.com/package/gavel)
- [json-schema-faker](https://www.npmjs.com/package/json-schema-faker)
- [lerna](https://www.npmjs.com/package/lerna)
- [micri](https://www.npmjs.com/package/micri)
- [openapi-sampler](https://www.npmjs.com/package/openapi-sampler)
- [yargs](https://www.npmjs.com/package/yargs)

Check these projects out!

[code_of_conduct]: CODE_OF_CONDUCT.md
[contributing]: CONTRIBUTING.md
[download-release]: https://github.com/stoplightio/prism/releases/latest
[core]: https://www.npmjs.com/package/@stoplight/prism-core
[http]: https://www.npmjs.com/package/@stoplight/prism-http
[http-server]: https://www.npmjs.com/package/@stoplight/prism-http-server
[cli]: https://www.npmjs.com/package/@stoplight/prism-cli
[cli-docs]: ./docs/getting-started/03-cli.md
[2.x]: https://github.com/stoplightio/prism/tree/2.x
[http-docs]: packages/http/README.md
[mocking_landing_page]: https://stoplight.io/api-mocking?utm_source=github&utm_medium=prism&utm_campaign=readme
[circle_ci]: https://circleci.com/gh/stoplightio/prism
[circle_ci_image]: https://img.shields.io/circleci/build/github/stoplightio/prism/master
[npm]: https://www.npmjs.com/package/@stoplight/prism-cli
[npm_image]: https://img.shields.io/npm/dw/@stoplight/prism-http?color=blue
[ecologi]: https://ecologi.com/stoplightinc
[ecologi_image]: https://img.shields.io/badge/Buy%20us%20a%20tree-%F0%9F%8C%B3-lightgreen
