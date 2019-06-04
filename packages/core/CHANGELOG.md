# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.0.0-alpha.12 (2019-06-04)


### Bug Fixes

* Fixed the security issue intrisic in Axios by updating its dependency in the project #334
* Fix a bug where paremeters where undetected, returning a REQUIERD error #325

### Features

* Respect the `Accept` header when requesting content to Prism #333
* Create a LICENSE file for the project #330
* Add new GitHub ISSUES template files for the project #326
* Decouple payload generation from its serialisation #322




# 3.0.0-alpha.11 (2019-05-24)


### Bug Fixes

* a bug where http operations were not resolved ([6aee679](https://github.com/stoplightio/prism/commit/6aee679))
* add tsconfig paths to make the CLI work natively in TS SL-2369 ([#219](https://github.com/stoplightio/prism/issues/219)) ([30298a9](https://github.com/stoplightio/prism/commit/30298a9))
* correctly install dependencies ([#302](https://github.com/stoplightio/prism/issues/302)) ([d3de5b1](https://github.com/stoplightio/prism/commit/d3de5b1))
* error serialisation SO-195 ([#274](https://github.com/stoplightio/prism/issues/274)) ([1199919](https://github.com/stoplightio/prism/commit/1199919))
* make sure http download works ([#276](https://github.com/stoplightio/prism/issues/276)) ([01828f3](https://github.com/stoplightio/prism/commit/01828f3))
* OAS3 integration tests and fixes SO-103 ([#253](https://github.com/stoplightio/prism/issues/253)) ([930d29e](https://github.com/stoplightio/prism/commit/930d29e))
* prism forwarder can work without an API in place [SL-1619] ([7c61c62](https://github.com/stoplightio/prism/commit/7c61c62))
* Prism should read yml files too SO-200 ([#299](https://github.com/stoplightio/prism/issues/299)) ([cbc96b2](https://github.com/stoplightio/prism/commit/cbc96b2))
* require the correct code ([2e6d242](https://github.com/stoplightio/prism/commit/2e6d242))
* separate config concept sl-2191 ([96e45fd](https://github.com/stoplightio/prism/commit/96e45fd))
* SL-2028 fixed absolute paths handling ([#197](https://github.com/stoplightio/prism/issues/197)) ([8d668a1](https://github.com/stoplightio/prism/commit/8d668a1))
* sync stuff should be sync ([b4b3e8b](https://github.com/stoplightio/prism/commit/b4b3e8b))
* upgrade graphite ([#308](https://github.com/stoplightio/prism/issues/308)) ([4b6458a](https://github.com/stoplightio/prism/commit/4b6458a))


### Features

* add oas3 plugin ([58ebc4c](https://github.com/stoplightio/prism/commit/58ebc4c))
* add some unit tests ([46ac012](https://github.com/stoplightio/prism/commit/46ac012))
* Implement header mocking functionality SO-227 ([#314](https://github.com/stoplightio/prism/issues/314)) ([5f0c0ba](https://github.com/stoplightio/prism/commit/5f0c0ba))
* integrate Prism with Graph (WIP) ([f4d8b1e](https://github.com/stoplightio/prism/commit/f4d8b1e))
* release prism 3.x alpha with required scripts ([6864986](https://github.com/stoplightio/prism/commit/6864986))
* revisit the build process ([d7d307f](https://github.com/stoplightio/prism/commit/d7d307f))
* SL-2035 cli url spec ([#200](https://github.com/stoplightio/prism/issues/200)) ([76ae24f](https://github.com/stoplightio/prism/commit/76ae24f))
* SO-141 Problem+Json for error messages SO-141 ([#270](https://github.com/stoplightio/prism/issues/270)) ([a5a3a67](https://github.com/stoplightio/prism/commit/a5a3a67))
* **core:** implement a graph resource loader ([431789e](https://github.com/stoplightio/prism/commit/431789e))
* **mocker:** integrate mocker with business logic ([e4513c5](https://github.com/stoplightio/prism/commit/e4513c5))
* **negotiator:** add unit tests for helpers ([45603e9](https://github.com/stoplightio/prism/commit/45603e9))
