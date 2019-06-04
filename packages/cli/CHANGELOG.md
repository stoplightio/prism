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

* add missing referenced project ([7621f8a](https://github.com/stoplightio/prism/commit/7621f8a))
* add tsconfig paths to make the CLI work natively in TS SL-2369 ([#219](https://github.com/stoplightio/prism/issues/219)) ([30298a9](https://github.com/stoplightio/prism/commit/30298a9))
* correctly install dependencies ([#302](https://github.com/stoplightio/prism/issues/302)) ([d3de5b1](https://github.com/stoplightio/prism/commit/d3de5b1))
* dependencies ([ebd2536](https://github.com/stoplightio/prism/commit/ebd2536))
* make sure http download works ([#276](https://github.com/stoplightio/prism/issues/276)) ([01828f3](https://github.com/stoplightio/prism/commit/01828f3))
* OAS3 integration tests and fixes SO-103 ([#253](https://github.com/stoplightio/prism/issues/253)) ([930d29e](https://github.com/stoplightio/prism/commit/930d29e))
* prism forwarder can work without an API in place [SL-1619] ([7c61c62](https://github.com/stoplightio/prism/commit/7c61c62))
* Prism should read yml files too SO-200 ([#299](https://github.com/stoplightio/prism/issues/299)) ([cbc96b2](https://github.com/stoplightio/prism/commit/cbc96b2))
* remove explicit dependency ([fd2885f](https://github.com/stoplightio/prism/commit/fd2885f))
* remove other packages and update ([9eb9bfa](https://github.com/stoplightio/prism/commit/9eb9bfa))
* running `prism` cli threw exception ([#190](https://github.com/stoplightio/prism/issues/190)) ([1893ccc](https://github.com/stoplightio/prism/commit/1893ccc))
* separate config concept sl-2191 ([96e45fd](https://github.com/stoplightio/prism/commit/96e45fd))
* SL-82 created common args/flags place for cli ([9f53eef](https://github.com/stoplightio/prism/commit/9f53eef))
* SO-82 fixed tests ([545294a](https://github.com/stoplightio/prism/commit/545294a))
* try to publish first, and then publish binaries ([#318](https://github.com/stoplightio/prism/issues/318)) ([1d8618c](https://github.com/stoplightio/prism/commit/1d8618c))
* upgrade graphite ([#308](https://github.com/stoplightio/prism/issues/308)) ([4b6458a](https://github.com/stoplightio/prism/commit/4b6458a))
* use rootDirs and outDir to help oclif config find source commands ([964b043](https://github.com/stoplightio/prism/commit/964b043))


### Features

* --dynamic flag for CLI SO-217 ([#301](https://github.com/stoplightio/prism/issues/301)) ([f1f27cf](https://github.com/stoplightio/prism/commit/f1f27cf))
* Add binary script SO-162 ([#271](https://github.com/stoplightio/prism/issues/271)) ([3b6b508](https://github.com/stoplightio/prism/commit/3b6b508))
* CLI show endpoints and status SO-201 ([#296](https://github.com/stoplightio/prism/issues/296)) ([d60830b](https://github.com/stoplightio/prism/commit/d60830b))
* Implement header mocking functionality SO-227 ([#314](https://github.com/stoplightio/prism/issues/314)) ([5f0c0ba](https://github.com/stoplightio/prism/commit/5f0c0ba))
* integrate Prism with Graph (WIP) ([f4d8b1e](https://github.com/stoplightio/prism/commit/f4d8b1e))
* release prism 3.x alpha with required scripts ([6864986](https://github.com/stoplightio/prism/commit/6864986))
* revisit the build process ([d7d307f](https://github.com/stoplightio/prism/commit/d7d307f))
* SL-2035 cli url spec ([#200](https://github.com/stoplightio/prism/issues/200)) ([76ae24f](https://github.com/stoplightio/prism/commit/76ae24f))
* SL-2037 forbidding dirs to be supplied to --spec cli's arg ([#198](https://github.com/stoplightio/prism/issues/198)) ([05c4b3c](https://github.com/stoplightio/prism/commit/05c4b3c))
* SL-82 split mock and server commands ([ddf87bd](https://github.com/stoplightio/prism/commit/ddf87bd))
* SO-141 Problem+Json for error messages SO-141 ([#270](https://github.com/stoplightio/prism/issues/270)) ([a5a3a67](https://github.com/stoplightio/prism/commit/a5a3a67))
* **cli:** add validation support and resource resolution ([14b4b7d](https://github.com/stoplightio/prism/commit/14b4b7d))
