# Changelog

## [5.8.3](https://github.com/stoplightio/prism/compare/v5.8.2...v5.8.3) (2024-07-19)


### Bug Fixes

* mock issue resolve for similar templated requests ([#2564](https://github.com/stoplightio/prism/issues/2564)) ([b8e9fd8](https://github.com/stoplightio/prism/commit/b8e9fd815f0f612664b36704e4200d5473875fbe))

## [5.8.2](https://github.com/stoplightio/prism/compare/v5.8.1...v5.8.2) (2024-07-02)


### Bug Fixes

* **http-negotiator:** [#2381](https://github.com/stoplightio/prism/issues/2381) add additional warn log message ([#2550](https://github.com/stoplightio/prism/issues/2550)) ([64a23fc](https://github.com/stoplightio/prism/commit/64a23fc530ff1e01c186f01e77a5906c0251f394))

## [5.8.1](https://github.com/stoplightio/prism/compare/v5.8.0...v5.8.1) (2024-04-29)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.7.0 to ^5.8.0

## [5.8.0](https://github.com/stoplightio/prism/compare/v5.7.0...v5.8.0) (2024-04-29)


### Features

* **deps:** bump node from 16 to 18.20 ([#2520](https://github.com/stoplightio/prism/issues/2520)) ([4b175a6](https://github.com/stoplightio/prism/commit/4b175a614a7d1f184863d741c8cbec494b37b57f))


### Bug Fixes

* readOnly objects in arrays are handled correctly ([#2513](https://github.com/stoplightio/prism/issues/2513)) ([7670236](https://github.com/stoplightio/prism/commit/767023681f481d5e9d8c46203613faa635541eab))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.6.0 to ^5.7.0

## [5.7.0](https://github.com/stoplightio/prism/compare/v5.6.0...v5.7.0) (2024-03-22)


### Features

* STOP-243 - create prism instance with full spec ([#2501](https://github.com/stoplightio/prism/issues/2501)) ([ed41dca](https://github.com/stoplightio/prism/commit/ed41dca89e5ad673f1a0d813b403a44de7e367b2))

## [5.6.0](https://github.com/stoplightio/prism/compare/v5.5.4...v5.6.0) (2024-03-18)


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* adds more standard compliant request body handling ([#2260](https://github.com/stoplightio/prism/issues/2260)) ([3b56cb7](https://github.com/stoplightio/prism/commit/3b56cb72f41d106cbcc95bb7c27711a3c05c6298))
* Allow JSON Schema Faker configuration in specification ([b72dd03](https://github.com/stoplightio/prism/commit/b72dd03e24bea4a7178c824eb0d83c68715f1503))
* better validation for optional auth ([#2401](https://github.com/stoplightio/prism/issues/2401)) ([e2d9f0f](https://github.com/stoplightio/prism/commit/e2d9f0f23884c73a8dad371e3497a0956c00ee11))
* **http:** added support to Deprecation header for deprecated operations [#1563](https://github.com/stoplightio/prism/issues/1563) ([1415319](https://github.com/stoplightio/prism/commit/14153193c69bccd960e62bc2b86ec23470d66921))
* **http:** detect complex schema error, improve error message ([#2327](https://github.com/stoplightio/prism/issues/2327)) ([07af511](https://github.com/stoplightio/prism/commit/07af51120ecb8593bc7c0892bc79f5ad5258a67c))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([931fc0f](https://github.com/stoplightio/prism/commit/931fc0fe47b4ff4ec58f8ba3369d50f8d1bf47c3))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([bfc258a](https://github.com/stoplightio/prism/commit/bfc258aa98e49c46fa5116ca1e7b49b8a3117ce9))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([1a05283](https://github.com/stoplightio/prism/commit/1a0528365251043d041c487ebeb905a51310e420))
* fixed handling of number with format: double ([e10a1e5](https://github.com/stoplightio/prism/commit/e10a1e54995bd0a0c325412de63041835023f5d5))
* 1917 fixed handling of example request for invalid requests ([444012b](https://github.com/stoplightio/prism/commit/444012bf1d9675abb2628727d4c5b39de486eb43))
* another fix for memory leak of schema validation ([ded2a9b](https://github.com/stoplightio/prism/commit/ded2a9b110459b7c15e00115e5a600f6f8cd8438))
* decode path before matching it ([ed5bce8](https://github.com/stoplightio/prism/commit/ed5bce837fb0cf83d15fb1a085227986f063aee7))
* **http:** add explicit dependency on chalk ([#2263](https://github.com/stoplightio/prism/issues/2263)) ([55b07c9](https://github.com/stoplightio/prism/commit/55b07c98145799faf0aae47a023a34a6e22e714b))
* json schema faker fillProperties not working ([#2398](https://github.com/stoplightio/prism/issues/2398)) ([e8acebd](https://github.com/stoplightio/prism/commit/e8acebd430dfe3cfc9db7bda3228256153346488))
* keep encoded value if uri decoding fails. ([#2387](https://github.com/stoplightio/prism/issues/2387)) ([aba9bee](https://github.com/stoplightio/prism/commit/aba9bee0dae442da8364c327bd3d2e560e7de4cc))
* remove deprecated usage of parse ([#1959](https://github.com/stoplightio/prism/issues/1959)) ([ea5b445](https://github.com/stoplightio/prism/commit/ea5b44555435424c2743fd3cde9bea75a408c6b8))
* replace date-time validator with our bug fixed version ([#1856](https://github.com/stoplightio/prism/issues/1856)) ([44186db](https://github.com/stoplightio/prism/commit/44186dbf6eba6ad506fd9f08e473edf891cdbf3c))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))
* upgrade dependencies and resolve breaking http spec changes ([#2105](https://github.com/stoplightio/prism/issues/2105)) ([ebbc6c1](https://github.com/stoplightio/prism/commit/ebbc6c1546aced8db0f492dd80651d2459c9bae0))
* use proper client call in memory leak tests ([c223192](https://github.com/stoplightio/prism/commit/c223192750c2edde958e43da8bffe639f2672952))
* validateOutput() when schema contains internal reference ([#2363](https://github.com/stoplightio/prism/issues/2363)) ([8e143e6](https://github.com/stoplightio/prism/commit/8e143e6622bdc8098a5c86c399831a12858612d5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.5.4 to ^5.6.0
