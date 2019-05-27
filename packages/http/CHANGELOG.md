# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.0.0-alpha.11 (2019-05-24)


### Bug Fixes

* add tsconfig paths to make the CLI work natively in TS SL-2369 ([#219](https://github.com/stoplightio/prism/issues/219)) ([30298a9](https://github.com/stoplightio/prism/commit/30298a9))
* correctly install dependencies ([#302](https://github.com/stoplightio/prism/issues/302)) ([d3de5b1](https://github.com/stoplightio/prism/commit/d3de5b1))
* do not throw when you can't find an example ([06f9435](https://github.com/stoplightio/prism/commit/06f9435))
* error serialisation SO-195 ([#274](https://github.com/stoplightio/prism/issues/274)) ([1199919](https://github.com/stoplightio/prism/commit/1199919))
* get rid of ajv console warn ([b11cd48](https://github.com/stoplightio/prism/commit/b11cd48))
* it's ok if we do not have examples or schemas ([5a93f1d](https://github.com/stoplightio/prism/commit/5a93f1d))
* look for 422 for invalid requests ([#278](https://github.com/stoplightio/prism/issues/278)) ([7a1c073](https://github.com/stoplightio/prism/commit/7a1c073))
* OAS3 integration tests and fixes SO-103 ([#253](https://github.com/stoplightio/prism/issues/253)) ([930d29e](https://github.com/stoplightio/prism/commit/930d29e))
* prism forwarder can work without an API in place [SL-1619] ([7c61c62](https://github.com/stoplightio/prism/commit/7c61c62))
* schema faker fix ([#195](https://github.com/stoplightio/prism/issues/195)) ([5889cc7](https://github.com/stoplightio/prism/commit/5889cc7))
* separate config concept sl-2191 ([96e45fd](https://github.com/stoplightio/prism/commit/96e45fd))
* SL-2192 stringify examples ([#205](https://github.com/stoplightio/prism/issues/205)) ([bbf6492](https://github.com/stoplightio/prism/commit/bbf6492))
* SL-2377 host/forwarded headers support ([#249](https://github.com/stoplightio/prism/issues/249)) ([f8a1131](https://github.com/stoplightio/prism/commit/f8a1131))
* SL-80 fixed router logic ([7a3d35e](https://github.com/stoplightio/prism/commit/7a3d35e))
* SL-80 fixed test ([d1c8974](https://github.com/stoplightio/prism/commit/d1c8974))
* SO-80 default to empty body, match even if no servers ([c92e487](https://github.com/stoplightio/prism/commit/c92e487))
* SO-80 fixed example ([b7afa9b](https://github.com/stoplightio/prism/commit/b7afa9b))
* SO-80 updated test name ([d67d04a](https://github.com/stoplightio/prism/commit/d67d04a))
* try to generate an example only if the schema is provided ([b9b3310](https://github.com/stoplightio/prism/commit/b9b3310))
* upgrade graphite ([#308](https://github.com/stoplightio/prism/issues/308)) ([4b6458a](https://github.com/stoplightio/prism/commit/4b6458a))
* **mocker:** a bug where Content-Type was set but we didn't find it ([b5a9dd8](https://github.com/stoplightio/prism/commit/b5a9dd8))
* **validator:** a bug where fastify omits hasOwnProperty in query obj ([726fcff](https://github.com/stoplightio/prism/commit/726fcff))
* **validator:** a bug where json object failed to parse ([fbdab3c](https://github.com/stoplightio/prism/commit/fbdab3c))


### Features

* --dynamic flag for CLI SO-217 ([#301](https://github.com/stoplightio/prism/issues/301)) ([f1f27cf](https://github.com/stoplightio/prism/commit/f1f27cf))
* add some unit tests ([46ac012](https://github.com/stoplightio/prism/commit/46ac012))
* add tests and modify error response message ([73db545](https://github.com/stoplightio/prism/commit/73db545))
* Implement header mocking functionality SO-227 ([#314](https://github.com/stoplightio/prism/issues/314)) ([5f0c0ba](https://github.com/stoplightio/prism/commit/5f0c0ba))
* **http-forwarder:** add support for timeout and cancelToken ([#309](https://github.com/stoplightio/prism/issues/309)) ([8e1db46](https://github.com/stoplightio/prism/commit/8e1db46))
* integrate Prism with Graph (WIP) ([f4d8b1e](https://github.com/stoplightio/prism/commit/f4d8b1e))
* release prism 3.x alpha with required scripts ([6864986](https://github.com/stoplightio/prism/commit/6864986))
* revisit the build process ([d7d307f](https://github.com/stoplightio/prism/commit/d7d307f))
* SO-141 Problem+Json for error messages SO-141 ([#270](https://github.com/stoplightio/prism/issues/270)) ([a5a3a67](https://github.com/stoplightio/prism/commit/a5a3a67))
* support OAS json schema formats ([7c3c4f5](https://github.com/stoplightio/prism/commit/7c3c4f5))
* throw exception when path is matched but method is not allowed. ([de32fb0](https://github.com/stoplightio/prism/commit/de32fb0))
* **config:** add functional tests to meet AC ([32f486b](https://github.com/stoplightio/prism/commit/32f486b))
* **httpConfig:** add default config support and unit test ([4f0a062](https://github.com/stoplightio/prism/commit/4f0a062))
* **mocker:** fix tests ([27b74a3](https://github.com/stoplightio/prism/commit/27b74a3))
* **mocker:** fixed test ([08c4d7f](https://github.com/stoplightio/prism/commit/08c4d7f))
* **mocker:** integrate mocker with business logic ([e4513c5](https://github.com/stoplightio/prism/commit/e4513c5))
* **mocker:** remove httpRequest from method signature ([5163835](https://github.com/stoplightio/prism/commit/5163835))
* **mocker:** take http request into account ([85f1bc0](https://github.com/stoplightio/prism/commit/85f1bc0))
* **negotiator:** add remaining negotiator tests ([944531f](https://github.com/stoplightio/prism/commit/944531f))
* **negotiator:** add unit tests for helpers ([45603e9](https://github.com/stoplightio/prism/commit/45603e9))
* **router:** add matchPath function ([7292957](https://github.com/stoplightio/prism/commit/7292957))
* **router:** add two more corner case tests for clarification ([23dc242](https://github.com/stoplightio/prism/commit/23dc242))
* **router:** implemented and unit tested router ([07a31a1](https://github.com/stoplightio/prism/commit/07a31a1))
* **router:** lint and autofix all style issues ([9eb501c](https://github.com/stoplightio/prism/commit/9eb501c))
* **router:** made baseUrl optional to ignore server matching ([91669a8](https://github.com/stoplightio/prism/commit/91669a8))
* **router:** make disambiguateMatches() private ([91c2a7b](https://github.com/stoplightio/prism/commit/91c2a7b))
* **router:** throw exceptions instead return null ([ebb6d2c](https://github.com/stoplightio/prism/commit/ebb6d2c))
* **router:** WIP add disambiguation and server matching ([c778ae6](https://github.com/stoplightio/prism/commit/c778ae6))
* **router:** WIP dummy router implementation and specs ([2dc3f8b](https://github.com/stoplightio/prism/commit/2dc3f8b))
