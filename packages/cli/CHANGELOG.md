# Changelog

## [5.8.3](https://github.com/stoplightio/prism/compare/v5.8.2...v5.8.3) (2024-07-19)


### Bug Fixes

* mock issue resolve for similar templated requests ([#2564](https://github.com/stoplightio/prism/issues/2564)) ([b8e9fd8](https://github.com/stoplightio/prism/commit/b8e9fd815f0f612664b36704e4200d5473875fbe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-http-server bumped from ^5.8.2 to ^5.8.3

## [5.8.2](https://github.com/stoplightio/prism/compare/v5.8.1...v5.8.2) (2024-07-02)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-http bumped from ^5.8.1 to ^5.8.2
    * @stoplight/prism-http-server bumped from ^5.8.1 to ^5.8.2

## [5.8.1](https://github.com/stoplightio/prism/compare/v5.8.0...v5.8.1) (2024-04-29)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.7.0 to ^5.8.0
    * @stoplight/prism-http bumped from ^5.8.0 to ^5.8.1
    * @stoplight/prism-http-server bumped from ^5.8.0 to ^5.8.1

## [5.8.0](https://github.com/stoplightio/prism/compare/v5.7.0...v5.8.0) (2024-04-29)


### Features

* **deps:** bump node from 16 to 18.20 ([#2520](https://github.com/stoplightio/prism/issues/2520)) ([4b175a6](https://github.com/stoplightio/prism/commit/4b175a614a7d1f184863d741c8cbec494b37b57f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.6.0 to ^5.7.0
    * @stoplight/prism-http bumped from ^5.7.0 to ^5.8.0
    * @stoplight/prism-http-server bumped from ^5.7.0 to ^5.8.0

## [5.7.0](https://github.com/stoplightio/prism/compare/v5.6.0...v5.7.0) (2024-03-22)


### Features

* STOP-243 - create prism instance with full spec ([#2501](https://github.com/stoplightio/prism/issues/2501)) ([ed41dca](https://github.com/stoplightio/prism/commit/ed41dca89e5ad673f1a0d813b403a44de7e367b2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-http bumped from ^5.6.0 to ^5.7.0
    * @stoplight/prism-http-server bumped from ^5.6.0 to ^5.7.0

## [5.6.0](https://github.com/stoplightio/prism/compare/v5.5.4...v5.6.0) (2024-03-18)


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* Allow JSON Schema Faker configuration in specification ([b72dd03](https://github.com/stoplightio/prism/commit/b72dd03e24bea4a7178c824eb0d83c68715f1503))
* **proxy:** add a flag to skip request validation ([71d04c8](https://github.com/stoplightio/prism/commit/71d04c8e19fef64f1354a17e51cf48a0d8b4bee7))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* fixed [#1860](https://github.com/stoplightio/prism/issues/1860) performance regression ([fe6345d](https://github.com/stoplightio/prism/commit/fe6345dc8a78dc0a0a30774c0175422c9cc93139))
* json schema faker fillProperties not working ([#2398](https://github.com/stoplightio/prism/issues/2398)) ([e8acebd](https://github.com/stoplightio/prism/commit/e8acebd430dfe3cfc9db7bda3228256153346488))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))
* upgrade dependencies and resolve breaking http spec changes ([#2105](https://github.com/stoplightio/prism/issues/2105)) ([ebbc6c1](https://github.com/stoplightio/prism/commit/ebbc6c1546aced8db0f492dd80651d2459c9bae0))
* upgrade jsrp to 9.2.4 to allow basic auth ([#2279](https://github.com/stoplightio/prism/issues/2279)) ([2148a2b](https://github.com/stoplightio/prism/commit/2148a2bc9c43d2897900ffe5838d7bc76fd8a3d1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.5.4 to ^5.6.0
    * @stoplight/prism-http bumped from ^5.5.4 to ^5.6.0
    * @stoplight/prism-http-server bumped from ^5.5.4 to ^5.6.0
