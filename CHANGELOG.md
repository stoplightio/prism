# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

<!-- markdown-link-check-disable -->

## [5.11.0](https://github.com/stoplightio/prism/compare/v5.10.0...v5.11.0) (2024-07-19)


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* adds more standard compliant request body handling ([#2260](https://github.com/stoplightio/prism/issues/2260)) ([3b56cb7](https://github.com/stoplightio/prism/commit/3b56cb72f41d106cbcc95bb7c27711a3c05c6298))
* Allow JSON Schema Faker configuration in specification ([b72dd03](https://github.com/stoplightio/prism/commit/b72dd03e24bea4a7178c824eb0d83c68715f1503))
* better validation for optional auth ([#2401](https://github.com/stoplightio/prism/issues/2401)) ([e2d9f0f](https://github.com/stoplightio/prism/commit/e2d9f0f23884c73a8dad371e3497a0956c00ee11))
* **deps:** bump node from 16 to 18.20 ([#2520](https://github.com/stoplightio/prism/issues/2520)) ([4b175a6](https://github.com/stoplightio/prism/commit/4b175a614a7d1f184863d741c8cbec494b37b57f))
* **deps:** bump xcode version ([#2522](https://github.com/stoplightio/prism/issues/2522)) ([939f749](https://github.com/stoplightio/prism/commit/939f749100ed2a1d36bf0e62c37190ac192ea209))
* **http:** added support to Deprecation header for deprecated operations [#1563](https://github.com/stoplightio/prism/issues/1563) ([1415319](https://github.com/stoplightio/prism/commit/14153193c69bccd960e62bc2b86ec23470d66921))
* **http:** detect complex schema error, improve error message ([#2327](https://github.com/stoplightio/prism/issues/2327)) ([07af511](https://github.com/stoplightio/prism/commit/07af51120ecb8593bc7c0892bc79f5ad5258a67c))
* **proxy:** add a flag to skip request validation ([71d04c8](https://github.com/stoplightio/prism/commit/71d04c8e19fef64f1354a17e51cf48a0d8b4bee7))
* STOP-243 - create prism instance with full spec ([#2501](https://github.com/stoplightio/prism/issues/2501)) ([ed41dca](https://github.com/stoplightio/prism/commit/ed41dca89e5ad673f1a0d813b403a44de7e367b2))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([931fc0f](https://github.com/stoplightio/prism/commit/931fc0fe47b4ff4ec58f8ba3369d50f8d1bf47c3))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([bfc258a](https://github.com/stoplightio/prism/commit/bfc258aa98e49c46fa5116ca1e7b49b8a3117ce9))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([1a05283](https://github.com/stoplightio/prism/commit/1a0528365251043d041c487ebeb905a51310e420))
* [#7839](https://github.com/stoplightio/prism/issues/7839) fixed handling of number with format: double ([e10a1e5](https://github.com/stoplightio/prism/commit/e10a1e54995bd0a0c325412de63041835023f5d5))
* 1917 fixed handling of example request for invalid requests ([444012b](https://github.com/stoplightio/prism/commit/444012bf1d9675abb2628727d4c5b39de486eb43))
* another fix for memory leak of schema validation ([ded2a9b](https://github.com/stoplightio/prism/commit/ded2a9b110459b7c15e00115e5a600f6f8cd8438))
* **ci:** release please simpler config ([#2489](https://github.com/stoplightio/prism/issues/2489)) ([b6be539](https://github.com/stoplightio/prism/commit/b6be539ff987194fda497d6b08c3671a7beed63f))
* **ci:** release please with checkout ([#2492](https://github.com/stoplightio/prism/issues/2492)) ([ea378fc](https://github.com/stoplightio/prism/commit/ea378fc9187989b7eea42eb2d2f24e31bacf08a4))
* **ci:** release please with root ([#2497](https://github.com/stoplightio/prism/issues/2497)) ([6043a9b](https://github.com/stoplightio/prism/commit/6043a9b792c6838acfa3d48c1bfe34ca8b7ba094))
* **ci:** remove root from release please ([#2494](https://github.com/stoplightio/prism/issues/2494)) ([ad1743e](https://github.com/stoplightio/prism/commit/ad1743ee0387a13c85e5d37628bc2ba1236f83fb))
* **ci:** STOP-267 add release please manifest ([#2484](https://github.com/stoplightio/prism/issues/2484)) ([82fe01e](https://github.com/stoplightio/prism/commit/82fe01e3a868863ba2854b7a14e8c10666b4f4a3))
* **ci:** STOP-267 automate release branch creation ([#2479](https://github.com/stoplightio/prism/issues/2479)) ([182e4f9](https://github.com/stoplightio/prism/commit/182e4f96917d4967b9d363657ef65528ce3e33ae))
* **ci:** STOP-267 improve auto-release config ([#2481](https://github.com/stoplightio/prism/issues/2481)) ([bb29592](https://github.com/stoplightio/prism/commit/bb29592ded13f2ec248236a564b46b6180f5e100))
* decode path before matching it ([ed5bce8](https://github.com/stoplightio/prism/commit/ed5bce837fb0cf83d15fb1a085227986f063aee7))
* **deps:** bump sanitize-html for security ([#1828](https://github.com/stoplightio/prism/issues/1828)) ([3fc86f4](https://github.com/stoplightio/prism/commit/3fc86f46fac222ceb4900d1f1d75f85543cf71f7))
* fixed [#1860](https://github.com/stoplightio/prism/issues/1860) performance regression ([fe6345d](https://github.com/stoplightio/prism/commit/fe6345dc8a78dc0a0a30774c0175422c9cc93139))
* **http-negotiator:** [#2381](https://github.com/stoplightio/prism/issues/2381) add additional warn log message ([#2550](https://github.com/stoplightio/prism/issues/2550)) ([64a23fc](https://github.com/stoplightio/prism/commit/64a23fc530ff1e01c186f01e77a5906c0251f394))
* **http-server:** discard request body if the content-length header i… ([#2103](https://github.com/stoplightio/prism/issues/2103)) ([c172f42](https://github.com/stoplightio/prism/commit/c172f42c89d67c3963eb9962d0550d5126756d34))
* **http:** add explicit dependency on chalk ([#2263](https://github.com/stoplightio/prism/issues/2263)) ([55b07c9](https://github.com/stoplightio/prism/commit/55b07c98145799faf0aae47a023a34a6e22e714b))
* json schema faker fillProperties not working ([#2398](https://github.com/stoplightio/prism/issues/2398)) ([e8acebd](https://github.com/stoplightio/prism/commit/e8acebd430dfe3cfc9db7bda3228256153346488))
* keep encoded value if uri decoding fails. ([#2387](https://github.com/stoplightio/prism/issues/2387)) ([aba9bee](https://github.com/stoplightio/prism/commit/aba9bee0dae442da8364c327bd3d2e560e7de4cc))
* mock issue resolve for similar templated requests ([#2564](https://github.com/stoplightio/prism/issues/2564)) ([b8e9fd8](https://github.com/stoplightio/prism/commit/b8e9fd815f0f612664b36704e4200d5473875fbe))
* **readme:** npm downloads badge ([#1849](https://github.com/stoplightio/prism/issues/1849)) ([3245a22](https://github.com/stoplightio/prism/commit/3245a22a059145aabf01d790992712405b3fbf11))
* readOnly objects in arrays are handled correctly ([#2513](https://github.com/stoplightio/prism/issues/2513)) ([7670236](https://github.com/stoplightio/prism/commit/767023681f481d5e9d8c46203613faa635541eab))
* remove deprecated usage of parse ([#1959](https://github.com/stoplightio/prism/issues/1959)) ([ea5b445](https://github.com/stoplightio/prism/commit/ea5b44555435424c2743fd3cde9bea75a408c6b8))
* replace date-time validator with our bug fixed version ([#1856](https://github.com/stoplightio/prism/issues/1856)) ([44186db](https://github.com/stoplightio/prism/commit/44186dbf6eba6ad506fd9f08e473edf891cdbf3c))
* testing circle ci build ([0d2deb0](https://github.com/stoplightio/prism/commit/0d2deb0cee73d73b301b5839103f2f50cbbc880b))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))
* upgrade dependencies and resolve breaking http spec changes ([#2105](https://github.com/stoplightio/prism/issues/2105)) ([ebbc6c1](https://github.com/stoplightio/prism/commit/ebbc6c1546aced8db0f492dd80651d2459c9bae0))
* upgrade deps to clean up last security vulnerabilities ([#2076](https://github.com/stoplightio/prism/issues/2076)) ([b1ac6f4](https://github.com/stoplightio/prism/commit/b1ac6f4c47a256c653965ebcd66f4693889ae157))
* upgrade jsrp to 9.2.4 to allow basic auth ([#2279](https://github.com/stoplightio/prism/issues/2279)) ([2148a2b](https://github.com/stoplightio/prism/commit/2148a2bc9c43d2897900ffe5838d7bc76fd8a3d1))
* use proper client call in memory leak tests ([c223192](https://github.com/stoplightio/prism/commit/c223192750c2edde958e43da8bffe639f2672952))
* validateOutput() when schema contains internal reference ([#2363](https://github.com/stoplightio/prism/issues/2363)) ([8e143e6](https://github.com/stoplightio/prism/commit/8e143e6622bdc8098a5c86c399831a12858612d5))

## [5.10.0](https://github.com/stoplightio/prism/compare/v5.9.0...v5.10.0) (2024-07-02)


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* adds more standard compliant request body handling ([#2260](https://github.com/stoplightio/prism/issues/2260)) ([3b56cb7](https://github.com/stoplightio/prism/commit/3b56cb72f41d106cbcc95bb7c27711a3c05c6298))
* Allow JSON Schema Faker configuration in specification ([b72dd03](https://github.com/stoplightio/prism/commit/b72dd03e24bea4a7178c824eb0d83c68715f1503))
* better validation for optional auth ([#2401](https://github.com/stoplightio/prism/issues/2401)) ([e2d9f0f](https://github.com/stoplightio/prism/commit/e2d9f0f23884c73a8dad371e3497a0956c00ee11))
* **deps:** bump node from 16 to 18.20 ([#2520](https://github.com/stoplightio/prism/issues/2520)) ([4b175a6](https://github.com/stoplightio/prism/commit/4b175a614a7d1f184863d741c8cbec494b37b57f))
* **deps:** bump xcode version ([#2522](https://github.com/stoplightio/prism/issues/2522)) ([939f749](https://github.com/stoplightio/prism/commit/939f749100ed2a1d36bf0e62c37190ac192ea209))
* **http:** added support to Deprecation header for deprecated operations [#1563](https://github.com/stoplightio/prism/issues/1563) ([1415319](https://github.com/stoplightio/prism/commit/14153193c69bccd960e62bc2b86ec23470d66921))
* **http:** detect complex schema error, improve error message ([#2327](https://github.com/stoplightio/prism/issues/2327)) ([07af511](https://github.com/stoplightio/prism/commit/07af51120ecb8593bc7c0892bc79f5ad5258a67c))
* **proxy:** add a flag to skip request validation ([71d04c8](https://github.com/stoplightio/prism/commit/71d04c8e19fef64f1354a17e51cf48a0d8b4bee7))
* STOP-243 - create prism instance with full spec ([#2501](https://github.com/stoplightio/prism/issues/2501)) ([ed41dca](https://github.com/stoplightio/prism/commit/ed41dca89e5ad673f1a0d813b403a44de7e367b2))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([931fc0f](https://github.com/stoplightio/prism/commit/931fc0fe47b4ff4ec58f8ba3369d50f8d1bf47c3))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([bfc258a](https://github.com/stoplightio/prism/commit/bfc258aa98e49c46fa5116ca1e7b49b8a3117ce9))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([1a05283](https://github.com/stoplightio/prism/commit/1a0528365251043d041c487ebeb905a51310e420))
* [#7839](https://github.com/stoplightio/prism/issues/7839) fixed handling of number with format: double ([e10a1e5](https://github.com/stoplightio/prism/commit/e10a1e54995bd0a0c325412de63041835023f5d5))
* 1917 fixed handling of example request for invalid requests ([444012b](https://github.com/stoplightio/prism/commit/444012bf1d9675abb2628727d4c5b39de486eb43))
* another fix for memory leak of schema validation ([ded2a9b](https://github.com/stoplightio/prism/commit/ded2a9b110459b7c15e00115e5a600f6f8cd8438))
* **ci:** release please simpler config ([#2489](https://github.com/stoplightio/prism/issues/2489)) ([b6be539](https://github.com/stoplightio/prism/commit/b6be539ff987194fda497d6b08c3671a7beed63f))
* **ci:** release please with checkout ([#2492](https://github.com/stoplightio/prism/issues/2492)) ([ea378fc](https://github.com/stoplightio/prism/commit/ea378fc9187989b7eea42eb2d2f24e31bacf08a4))
* **ci:** release please with root ([#2497](https://github.com/stoplightio/prism/issues/2497)) ([6043a9b](https://github.com/stoplightio/prism/commit/6043a9b792c6838acfa3d48c1bfe34ca8b7ba094))
* **ci:** remove root from release please ([#2494](https://github.com/stoplightio/prism/issues/2494)) ([ad1743e](https://github.com/stoplightio/prism/commit/ad1743ee0387a13c85e5d37628bc2ba1236f83fb))
* **ci:** STOP-267 add release please manifest ([#2484](https://github.com/stoplightio/prism/issues/2484)) ([82fe01e](https://github.com/stoplightio/prism/commit/82fe01e3a868863ba2854b7a14e8c10666b4f4a3))
* **ci:** STOP-267 automate release branch creation ([#2479](https://github.com/stoplightio/prism/issues/2479)) ([182e4f9](https://github.com/stoplightio/prism/commit/182e4f96917d4967b9d363657ef65528ce3e33ae))
* **ci:** STOP-267 improve auto-release config ([#2481](https://github.com/stoplightio/prism/issues/2481)) ([bb29592](https://github.com/stoplightio/prism/commit/bb29592ded13f2ec248236a564b46b6180f5e100))
* decode path before matching it ([ed5bce8](https://github.com/stoplightio/prism/commit/ed5bce837fb0cf83d15fb1a085227986f063aee7))
* **deps:** bump sanitize-html for security ([#1828](https://github.com/stoplightio/prism/issues/1828)) ([3fc86f4](https://github.com/stoplightio/prism/commit/3fc86f46fac222ceb4900d1f1d75f85543cf71f7))
* fixed [#1860](https://github.com/stoplightio/prism/issues/1860) performance regression ([fe6345d](https://github.com/stoplightio/prism/commit/fe6345dc8a78dc0a0a30774c0175422c9cc93139))
* **http-negotiator:** [#2381](https://github.com/stoplightio/prism/issues/2381) add additional warn log message ([#2550](https://github.com/stoplightio/prism/issues/2550)) ([64a23fc](https://github.com/stoplightio/prism/commit/64a23fc530ff1e01c186f01e77a5906c0251f394))
* **http-server:** discard request body if the content-length header i… ([#2103](https://github.com/stoplightio/prism/issues/2103)) ([c172f42](https://github.com/stoplightio/prism/commit/c172f42c89d67c3963eb9962d0550d5126756d34))
* **http:** add explicit dependency on chalk ([#2263](https://github.com/stoplightio/prism/issues/2263)) ([55b07c9](https://github.com/stoplightio/prism/commit/55b07c98145799faf0aae47a023a34a6e22e714b))
* json schema faker fillProperties not working ([#2398](https://github.com/stoplightio/prism/issues/2398)) ([e8acebd](https://github.com/stoplightio/prism/commit/e8acebd430dfe3cfc9db7bda3228256153346488))
* keep encoded value if uri decoding fails. ([#2387](https://github.com/stoplightio/prism/issues/2387)) ([aba9bee](https://github.com/stoplightio/prism/commit/aba9bee0dae442da8364c327bd3d2e560e7de4cc))
* **readme:** npm downloads badge ([#1849](https://github.com/stoplightio/prism/issues/1849)) ([3245a22](https://github.com/stoplightio/prism/commit/3245a22a059145aabf01d790992712405b3fbf11))
* readOnly objects in arrays are handled correctly ([#2513](https://github.com/stoplightio/prism/issues/2513)) ([7670236](https://github.com/stoplightio/prism/commit/767023681f481d5e9d8c46203613faa635541eab))
* remove deprecated usage of parse ([#1959](https://github.com/stoplightio/prism/issues/1959)) ([ea5b445](https://github.com/stoplightio/prism/commit/ea5b44555435424c2743fd3cde9bea75a408c6b8))
* replace date-time validator with our bug fixed version ([#1856](https://github.com/stoplightio/prism/issues/1856)) ([44186db](https://github.com/stoplightio/prism/commit/44186dbf6eba6ad506fd9f08e473edf891cdbf3c))
* testing circle ci build ([0d2deb0](https://github.com/stoplightio/prism/commit/0d2deb0cee73d73b301b5839103f2f50cbbc880b))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))
* upgrade dependencies and resolve breaking http spec changes ([#2105](https://github.com/stoplightio/prism/issues/2105)) ([ebbc6c1](https://github.com/stoplightio/prism/commit/ebbc6c1546aced8db0f492dd80651d2459c9bae0))
* upgrade deps to clean up last security vulnerabilities ([#2076](https://github.com/stoplightio/prism/issues/2076)) ([b1ac6f4](https://github.com/stoplightio/prism/commit/b1ac6f4c47a256c653965ebcd66f4693889ae157))
* upgrade jsrp to 9.2.4 to allow basic auth ([#2279](https://github.com/stoplightio/prism/issues/2279)) ([2148a2b](https://github.com/stoplightio/prism/commit/2148a2bc9c43d2897900ffe5838d7bc76fd8a3d1))
* use proper client call in memory leak tests ([c223192](https://github.com/stoplightio/prism/commit/c223192750c2edde958e43da8bffe639f2672952))
* validateOutput() when schema contains internal reference ([#2363](https://github.com/stoplightio/prism/issues/2363)) ([8e143e6](https://github.com/stoplightio/prism/commit/8e143e6622bdc8098a5c86c399831a12858612d5))

## [5.9.0](https://github.com/stoplightio/prism/compare/v5.8.0...v5.9.0) (2024-04-29)


### Features

* **deps:** bump xcode version ([#2522](https://github.com/stoplightio/prism/issues/2522)) ([939f749](https://github.com/stoplightio/prism/commit/939f749100ed2a1d36bf0e62c37190ac192ea209))

## [5.8.0](https://github.com/stoplightio/prism/compare/v5.7.0...v5.8.0) (2024-04-29)


### Features

* **deps:** bump node from 16 to 18.20 ([#2520](https://github.com/stoplightio/prism/issues/2520)) ([4b175a6](https://github.com/stoplightio/prism/commit/4b175a614a7d1f184863d741c8cbec494b37b57f))


### Bug Fixes

* readOnly objects in arrays are handled correctly ([#2513](https://github.com/stoplightio/prism/issues/2513)) ([7670236](https://github.com/stoplightio/prism/commit/767023681f481d5e9d8c46203613faa635541eab))

## [5.7.0](https://github.com/stoplightio/prism/compare/v5.6.0...v5.7.0) (2024-03-22)


### Features

* STOP-243 - create prism instance with full spec ([#2501](https://github.com/stoplightio/prism/issues/2501)) ([ed41dca](https://github.com/stoplightio/prism/commit/ed41dca89e5ad673f1a0d813b403a44de7e367b2))

## [5.6.0](https://github.com/stoplightio/prism/compare/v5.5.4...v5.6.0) (2024-03-18)

This is an inaccurate view of this release.
We are working to add Release Please to manage this and this should be cleaner in the next release. 
Sorry for the inconvenience.


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* adds more standard compliant request body handling ([#2260](https://github.com/stoplightio/prism/issues/2260)) ([3b56cb7](https://github.com/stoplightio/prism/commit/3b56cb72f41d106cbcc95bb7c27711a3c05c6298))
* Allow JSON Schema Faker configuration in specification ([b72dd03](https://github.com/stoplightio/prism/commit/b72dd03e24bea4a7178c824eb0d83c68715f1503))
* better validation for optional auth ([#2401](https://github.com/stoplightio/prism/issues/2401)) ([e2d9f0f](https://github.com/stoplightio/prism/commit/e2d9f0f23884c73a8dad371e3497a0956c00ee11))
* **http:** added support to Deprecation header for deprecated operations [#1563](https://github.com/stoplightio/prism/issues/1563) ([1415319](https://github.com/stoplightio/prism/commit/14153193c69bccd960e62bc2b86ec23470d66921))
* **http:** detect complex schema error, improve error message ([#2327](https://github.com/stoplightio/prism/issues/2327)) ([07af511](https://github.com/stoplightio/prism/commit/07af51120ecb8593bc7c0892bc79f5ad5258a67c))
* **proxy:** add a flag to skip request validation ([71d04c8](https://github.com/stoplightio/prism/commit/71d04c8e19fef64f1354a17e51cf48a0d8b4bee7))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([931fc0f](https://github.com/stoplightio/prism/commit/931fc0fe47b4ff4ec58f8ba3369d50f8d1bf47c3))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([bfc258a](https://github.com/stoplightio/prism/commit/bfc258aa98e49c46fa5116ca1e7b49b8a3117ce9))
* [#1881](https://github.com/stoplightio/prism/issues/1881) fixed memory leak for validation ([1a05283](https://github.com/stoplightio/prism/commit/1a0528365251043d041c487ebeb905a51310e420))
* fixed handling of number with format: double ([e10a1e5](https://github.com/stoplightio/prism/commit/e10a1e54995bd0a0c325412de63041835023f5d5))
* 1917 fixed handling of example request for invalid requests ([444012b](https://github.com/stoplightio/prism/commit/444012bf1d9675abb2628727d4c5b39de486eb43))
* another fix for memory leak of schema validation ([ded2a9b](https://github.com/stoplightio/prism/commit/ded2a9b110459b7c15e00115e5a600f6f8cd8438))
* **ci:** release please simpler config ([#2489](https://github.com/stoplightio/prism/issues/2489)) ([b6be539](https://github.com/stoplightio/prism/commit/b6be539ff987194fda497d6b08c3671a7beed63f))
* **ci:** release please with checkout ([#2492](https://github.com/stoplightio/prism/issues/2492)) ([ea378fc](https://github.com/stoplightio/prism/commit/ea378fc9187989b7eea42eb2d2f24e31bacf08a4))
* **ci:** release please with root ([#2497](https://github.com/stoplightio/prism/issues/2497)) ([6043a9b](https://github.com/stoplightio/prism/commit/6043a9b792c6838acfa3d48c1bfe34ca8b7ba094))
* **ci:** remove root from release please ([#2494](https://github.com/stoplightio/prism/issues/2494)) ([ad1743e](https://github.com/stoplightio/prism/commit/ad1743ee0387a13c85e5d37628bc2ba1236f83fb))
* **ci:** STOP-267 add release please manifest ([#2484](https://github.com/stoplightio/prism/issues/2484)) ([82fe01e](https://github.com/stoplightio/prism/commit/82fe01e3a868863ba2854b7a14e8c10666b4f4a3))
* **ci:** STOP-267 automate release branch creation ([#2479](https://github.com/stoplightio/prism/issues/2479)) ([182e4f9](https://github.com/stoplightio/prism/commit/182e4f96917d4967b9d363657ef65528ce3e33ae))
* **ci:** STOP-267 improve auto-release config ([#2481](https://github.com/stoplightio/prism/issues/2481)) ([bb29592](https://github.com/stoplightio/prism/commit/bb29592ded13f2ec248236a564b46b6180f5e100))
* decode path before matching it ([ed5bce8](https://github.com/stoplightio/prism/commit/ed5bce837fb0cf83d15fb1a085227986f063aee7))
* **deps:** bump sanitize-html for security ([#1828](https://github.com/stoplightio/prism/issues/1828)) ([3fc86f4](https://github.com/stoplightio/prism/commit/3fc86f46fac222ceb4900d1f1d75f85543cf71f7))
* fixed [#1860](https://github.com/stoplightio/prism/issues/1860) performance regression ([fe6345d](https://github.com/stoplightio/prism/commit/fe6345dc8a78dc0a0a30774c0175422c9cc93139))
* **http-server:** discard request body if the content-length header i… ([#2103](https://github.com/stoplightio/prism/issues/2103)) ([c172f42](https://github.com/stoplightio/prism/commit/c172f42c89d67c3963eb9962d0550d5126756d34))
* **http:** add explicit dependency on chalk ([#2263](https://github.com/stoplightio/prism/issues/2263)) ([55b07c9](https://github.com/stoplightio/prism/commit/55b07c98145799faf0aae47a023a34a6e22e714b))
* json schema faker fillProperties not working ([#2398](https://github.com/stoplightio/prism/issues/2398)) ([e8acebd](https://github.com/stoplightio/prism/commit/e8acebd430dfe3cfc9db7bda3228256153346488))
* keep encoded value if uri decoding fails. ([#2387](https://github.com/stoplightio/prism/issues/2387)) ([aba9bee](https://github.com/stoplightio/prism/commit/aba9bee0dae442da8364c327bd3d2e560e7de4cc))
* **readme:** npm downloads badge ([#1849](https://github.com/stoplightio/prism/issues/1849)) ([3245a22](https://github.com/stoplightio/prism/commit/3245a22a059145aabf01d790992712405b3fbf11))
* remove deprecated usage of parse ([#1959](https://github.com/stoplightio/prism/issues/1959)) ([ea5b445](https://github.com/stoplightio/prism/commit/ea5b44555435424c2743fd3cde9bea75a408c6b8))
* replace date-time validator with our bug fixed version ([#1856](https://github.com/stoplightio/prism/issues/1856)) ([44186db](https://github.com/stoplightio/prism/commit/44186dbf6eba6ad506fd9f08e473edf891cdbf3c))
* testing circle ci build ([0d2deb0](https://github.com/stoplightio/prism/commit/0d2deb0cee73d73b301b5839103f2f50cbbc880b))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))
* upgrade dependencies and resolve breaking http spec changes ([#2105](https://github.com/stoplightio/prism/issues/2105)) ([ebbc6c1](https://github.com/stoplightio/prism/commit/ebbc6c1546aced8db0f492dd80651d2459c9bae0))
* upgrade deps to clean up last security vulnerabilities ([#2076](https://github.com/stoplightio/prism/issues/2076)) ([b1ac6f4](https://github.com/stoplightio/prism/commit/b1ac6f4c47a256c653965ebcd66f4693889ae157))
* upgrade jsrp to 9.2.4 to allow basic auth ([#2279](https://github.com/stoplightio/prism/issues/2279)) ([2148a2b](https://github.com/stoplightio/prism/commit/2148a2bc9c43d2897900ffe5838d7bc76fd8a3d1))
* use proper client call in memory leak tests ([c223192](https://github.com/stoplightio/prism/commit/c223192750c2edde958e43da8bffe639f2672952))
* validateOutput() when schema contains internal reference ([#2363](https://github.com/stoplightio/prism/issues/2363)) ([8e143e6](https://github.com/stoplightio/prism/commit/8e143e6622bdc8098a5c86c399831a12858612d5))







## 5.5.4 (2024.02.02)

- upgrade dependencies to eliminate lodash prototype pollution vulnerabilities [#2459](https://github.com/stoplightio/prism/pull/2459)

## 5.5.3 (2024.01.12)

- added functionality to show unevaluated property name in error message [#2441](https://github.com/stoplightio/prism/pull/2441) - thanks @aleung for your contribution!

## 5.5.2 (2023.12.01)

- added support for default JSON deserialization for arrays of objects in form data request bodies in OpenAPI 3 [#2379](https://github.com/stoplightio/prism/pull/2379) - thanks @ilanashapiro for your contribution!

## 5.5.1 (2023.10.30)

- fixed issue with int64 [#2420](https://github.com/stoplightio/prism/pull/2420)

## 5.5.0 (2023.10.23)

- added new cli flag `--ignoreExamples` [#2408](https://github.com/stoplightio/prism/pull/2408) - thanks @ilanashapiro for your contribution!

## 5.4.0 (2023.10.09)

- Fixed issue with filling additional properties [#2398](https://github.com/stoplightio/prism/pull/2398)
- added more validation around optional security. [#2401](https://github.com/stoplightio/prism/pull/2401)
- Fixed issue with internal refs inside json schemas [#2402](https://github.com/stoplightio/prism/pull/2402)

## 5.3.2 (2023.09.19)

- fixed issue with sending binary data in proxy mode. [#2387](https://github.com/stoplightio/prism/pull/2387)

## 5.3.1 (2023.08.25)

- fixed issue with validateOutput() when schema contains internal reference. [#2363](https://github.com/stoplightio/prism/pull/2363) - thanks @mtjandra for your contribution!

## 5.3.0 (2023.08.17)

- added new cli parameter to control the json schema faker fillProperties setting universally. [#2355](https://github.com/stoplightio/prism/pull/2355)
- correctly list Response or Request in violation messages. [#2358](https://github.com/stoplightio/prism/pull/2358)

## 5.2.0 (2023.07.28)

- added support for multipart/form-data in the request body. [#2321](https://github.com/stoplightio/prism/pull/2321) - thanks @ilanashapiro for your contribution!

## 5.1.0 (2023.07.24)

- Improved error messages when using static mocking and the schema is too complex.

## 5.0.1 (2023.06.01)

- Limit the `sl-violations` response header to around 8 KB. [#2297](https://github.com/stoplightio/prism/pull/2297)
- Improve error messages that describe unresolvable JSON Pointer references. [#2195](https://github.com/stoplightio/prism/issues/2195)

## 5.0.0 (2023.05.17)

## Changed

- Bump minimatch from 3.0.4 to 3.0.5.
- Bump json5 from 1.0.1 to 1.0.2.

## Fixed

- Handle exploded form query params. [#2288](https://github.com/stoplightio/prism/pull/2288)
- Respect prefer header for validation proxy when server returns 501. [#2292](https://github.com/stoplightio/prism/pull/2292) - thanks @nursanamar for your contribution to this.

## 4.14.1 (2023.05.11)

## Fixed

- Bump @stoplight/types and @stoplight/http-spec to support `unspecified` parameter style to fix query param errors for OAS 2.0 documents.

## 4.14.0 (2023.05.08)

## Changed

- Improved request validation error messages (thanks @ilanashapiro) [#2280](https://github.com/stoplightio/prism/pull/2280)

## Fixed

- Allow spec document to be requested via HTTP Basic auth via the URL parameters in Node 18+. [#2279](https://github.com/stoplightio/prism/pull/2279)

## 4.13.0 (2023.04.28)

## Fixed

- Put `chalk` as an explicit dependency in the HTTP package [#x](https://github.com/stoplightio/prism/pull/x)
- Upgrade fast-xml-parser (thanks @spriggyjeff) [#2262](https://github.com/stoplightio/prism/pull/2262)
- Do not error when there is no response content but accept header is set (thanks @ilanashapiro) [#2267](https://github.com/stoplightio/prism/pull/2267)

## 4.12.0 (2023.04.12)

## Added

- Improves handling of GET/HEAD requests in the proxy that look like they include a request body. [#2260](https://github.com/stoplightio/prism/pull/2260)

## 4.11.1 (2023.03.15)

## Added

- CLI option flag `--verboseLevel` or `-v` to set log levels. [#2231](https://github.com/stoplightio/prism/pull/2231)

## 4.10.6 (2023.03.01)

## Changed

- Various 3rd party dependency updates.
- Send a user-agent when fetching remote spec content. [#2150](https://github.com/stoplightio/prism/pull/2150)

## Fixed

- Make x-json-schema-faker work more sensibly. [#2181](https://github.com/stoplightio/prism/pull/2181)

## 4.10.5 (2022.10.05)

## Fixed

- Fixed breaking change with mock command in v4.10.4. [#2138](https://github.com/stoplightio/prism/issues/2138)

## 4.10.4 (2022.09.14)

## Changed

- Various 3rd party dependency updates and Dependabot configuration changes

## 4.10.3 (2022.08.16)

## Fixed

- Fixed issue with recursive request body schemas. [#2090](https://github.com/stoplightio/prism/pull/2090)

## 4.10.2 (2022.08.11)

## Fixed

- Fixed issue with empty body when content-type header is set. [#2103](https://github.com/stoplightio/prism/pull/2103) - thanks @acolombier

## 4.10.1 (2022.06.22)

## Changed

- Upgraded dependencies to resolve security vulnerabilities. [#2075](https://github.com/stoplightio/prism/pull/2075) [#2076](https://github.com/stoplightio/prism/pull/2076)

## 4.10.0 (2022.06.07)

## Added

- Added support for ranges of response status codes. [#2065](https://github.com/stoplightio/prism/pull/2065)

## 4.9.3 (2022.05.19)

## Changed

- Update faker dependency to point to official community-maintained version. [#2021](https://github.com/stoplightio/prism/pull/2021) - thanks @jasonbarry

## 4.9.2 (2022.04.26)

## Added

- Alphabetize properties for dynamic responses. [#2041](https://github.com/stoplightio/prism/pull/2041)

## 4.9.1 (2022.04.20)

## Fixed

- Fixed issue where query parameters weren't being forwarded in proxy mode. [#2042](https://github.com/stoplightio/prism/pull/2042)

## 4.9.0 (2022.04.19)

## Changed

- Upgraded the minimum node engine version from 12 to 16 [#2023](https://github.com/stoplightio/prism/pull/2023) - thanks @jasonbarry
- Relaxed validation constraints for Postman Collections. All properties included in output are no longer marked as required in the generated json schema. Byproduct of removing dependency with security vulnerability. [#2037](https://github.com/stoplightio/prism/pull/2037)

## Fixed

- Fixed deprecated usage of `parse` [#1959](https://github.com/stoplightio/prism/pull/1959) - thanks @jbl428
- Removed dependency that had critical security vulnerability [#2037](https://github.com/stoplightio/prism/pull/2037)

## 4.8.0 (2022.02.17)

## Added

- Upstream proxy support [#1986](https://github.com/stoplightio/prism/pull/1986) - thanks @DyspC

## Changed

- Ignore `Content-Type` when validating a request and the body is empty instead of producing a HTTP 415. [#1990](https://github.com/stoplightio/prism/pull/1990)

## 4.7.0 (2022.02.03)

## Added

- CLI flag to control validating requests when running the proxy [#1980](https://github.com/stoplightio/prism/pull/1980)

## 4.6.2 (2021.12.10)

## Changed

- When `allOf` has the effect of adding `readOnly` to a property, the property is no longer required in input.
- When `allOf` has the effect of adding `writeOnly` to a property, the property is no longer required in output.

## 4.6.1 (2021.11.22)

## Changed

- in proxy mode, Prism does not send `Content-Encoding` header back to client as it was received from the upstream server because Prism's response is never compressed

## 4.6.0 (2021.11.08)

## Changed

- Prism now responds with 415 http code if request content-type does not match content-types available in operation body

## 4.5.0 (2021.10.21)

- allow [json-schema-faker configuration in specification](https://github.com/stoplightio/prism/pull/1899)

## 4.4.3 (2021.10.21)

## Fixed

- Ignoring example if prism decides to change response code #1919
- Updated dependencies #1916
- Do not check content-type for 204 code #1915

## 4.4.2 (2021.10.13)

## Fixed

- Fixed issue with generating numbers with maximum and minimum range of `Number.MAX_VALUE`

## 4.4.1 (2021.09.29)

## Fixed

- Fixed memory leak [#1881](https://github.com/stoplightio/prism/issues/1881)

## 4.4.0 (2021.09.09)

## Changed

- Added support for Deprecation header for deprecated operations [#1879](https://github.com/stoplightio/prism/pull/1879)

## 4.3.4 (2021-08-26)

## Fixed

- Better path matching for concrete and templated parts [1876](https://github.com/stoplightio/prism/pull/1876)

## 4.3.3 (2021-08-24)

## Fixed

- Fixes issue with encoded URLs: was unable to find them in spec while mocking.

## 4.3.2 (2021-08-23)

## Fixed

- Fixes performance regression in `prism-cli` [#1860](https://github.com/stoplightio/prism/issues/1860)

## 4.3.1 (2021-07-16)

## Fixed

- Fixed issue with date-time type validation [#1856](https://github.com/stoplightio/prism/pull/1856)

## 4.3.0 (2021-07-08)

## Changed

- Supports readOnly writeOnly properties [#1853](https://github.com/stoplightio/prism/pull/1853)

## 4.2.6 (2021-06-23)

## Changed

- Increase Max Request Size to 10mb by default [#1844](https://github.com/stoplightio/prism/pull/1844)

## 4.2.5 (2021-05-25)

## Changed

- Support Circular JSON Refs [#1835](https://github.com/stoplightio/prism/pull/1835)

## 4.2.4 (2021-05-24)

## Changed

- Improved the build pipeline [#1834](https://github.com/stoplightio/prism/pull/1834)

## 4.2.3 (2021-05-17)

## Fixed

- bumped `sanitize-html` dep to address security issue [#1828](https://github.com/stoplightio/prism/pull/1828)

## 4.2.2 (2021-05-04)

## Fixed

- encodeURI param names to avoid performance issues on startup [#1816](https://github.com/stoplightio/prism/pull/1816)

## 4.2.1 (2021-04-28)

## Changed

- Bump @stoplight/json-schema-sampler to support `if/then/else` JSON Schema compound keywords in static mode [#1792](https://github.com/stoplightio/prism/pull/1792)

## 4.2.0 (2021-04-23)

## Added

- Accept OAS 3.1 documents [#1783](https://github.com/stoplightio/prism/pull/1783)

## Fixed

- Return preferred example when validation fails [#1786](https://github.com/stoplightio/prism/pull/1786)

## 4.1.3 (2021-04-21)

## Fixed

- Prism is now supporting nullable validations [#1782](https://github.com/stoplightio/prism/pull/1782)

## 4.1.2 (2020-12-01)

## Fixed

- Yet another improvement for the returned path in Problem JSON payloads [#1548](https://github.com/stoplightio/prism/pull/1548)
- Prism is now respecting `min/maxItems` properties in JSON Schemas [#1530](https://github.com/stoplightio/prism/pull/1530)

## 4.1.1 (2020-11-24)

## Fixed

- Multiple HTTP Headers coming from a proxied response are now [correctly aggreagated using a `,`](https://tools.ietf.org/html/rfc2616#section-4.2) instead of a space. [#1489](https://github.com/stoplightio/prism/pull/1489)
- Improved the returned path for Problem JSON payloads [#1530](https://github.com/stoplightio/prism/pull/1530)
- Prism will now consider the first response in the document in case of the absence of a 2XX response, instead of requiring at least a successful response. [#1531](https://github.com/stoplightio/prism/pull/1531)

## Changed

- Prism will now validate that the requested code (either through prefer code header or \_\_code query param) is a number. [#1542](https://github.com/stoplightio/prism/pull/1542)

## 4.1.0 (2020-09-25)

## Changed

- When running in proxy mode and an upstream server responds with `501`, Prism will now "remock" the request and provide a meaningful response. This is a fancy way to say "if the upstream server has not yet implemented an operation, it will mock" [#1426](https://github.com/stoplightio/prism/pull/1426)

## 4.0.1 (2020-09-07)

## Fixed

- Fixed a type issue in the HTTP Client that would let you pass incorrect parameters [#1391](https://github.com/stoplightio/prism/pull/1391)

## 4.0.0 (2020-08-25)

## Fixed

- Prism will now refuse to start in case it will detect circular references. [#1270](https://github.com/stoplightio/prism/pull/1270)

## Changed

- Prism is now able to take in consideration all the responses defined for a request (typical in Postman Collection) and respond in a more appropriate way [#1310](https://github.com/stoplightio/prism/pull/1310)

* **BREAKING**: The `getHttpOperationsFromSpec` has been moved from the HTTP Package to the CLI package. If you're using Prism programmatically, this might require some code changes on your side. `getHttpOperationsFromResource` has been removed. [#1009](https://github.com/stoplightio/prism/pull/1009), [#1192](https://github.com/stoplightio/prism/pull/1192)
* **BREAKING**: The `createClientFromOperations` is now exported as `export function` instead of exporting an object. If you're using Prism programmatically, this might require some code changes on your side [#1009](https://github.com/stoplightio/prism/pull/1009)
* **BREAKING**: Prism does **NOT** support Node 8 and 10 anymore; the miminal runtime is now 12
* A significant number of dependencies has been upgraded

## 3.3.7 (2020-07-24)

## Fixed

- Prism's Proxy feature will stop proactively requesting Compressed responses, following what is really in the OAS document [#1309](https://github.com/stoplightio/prism/pull/1309),[#1319](https://github.com/stoplightio/prism/pull/1319)

## Changed

- Prism is now stop to claim error for paths declared in the document that are not starting with a `/` [#1340](https://github.com/stoplightio/prism/pull/1340)

## 3.3.6 (2020-07-08)

## Fixed

- Prism is not returning an error anymore when trying to construct a schema for HTTP headers and query string with mixed cases property names [#1268](https://github.com/stoplightio/prism/pull/1268)

## 3.3.5 (2020-05-26)

## Fixed

- Since the media type parameters are not standardised (apart from the quality one), the negotiator will discard them during the matching process or simply treat them as strings/numbers without trying to guess anything more [#1159](https://github.com/stoplightio/prism/pull/1159)
- Prism is now handling correctly hypens on both Path parameters and Query Parameters [#1189](https://github.com/stoplightio/prism/pull/1189), [#1992](https://github.com/stoplightio/prism/pull/1992)

## 3.3.4 (2020-05-04)

## Fixed

- The mock diagram has been updated to include the security validations [#1141](https://github.com/stoplightio/prism/pull/1141)
- Prism will now correctly refuse invalid requests even when used with the `proxy` command with the `--errors` flag [#1101](https://github.com/stoplightio/prism/pull/1101)
- Autogenerated security validation errors now have the `detail` field filled with an informative message [#1101](https://github.com/stoplightio/prism/pull/1101)
- Correctly catch some exceptions and propagate them to the CLI [#1107](https://github.com/stoplightio/prism/pull/1107)

## 3.3.3 (2020-04-02)

## Fixed

- All the dependencies used by the various Prism packages have been explicitily declared avoiding some resolutions problems in case you are using Prism programmatically [#1072](https://github.com/stoplightio/prism/pull/1072)
- Prism's current options aren't overriden internally anymore because of the `Prefer` header set [#1074](https://github.com/stoplightio/prism/pull/1074)

## 3.3.2 (2020-03-16)

## Fixed

- Prism will not correctly consider that HTTP Security Schemes are case insensitive [#1044](https://github.com/stoplightio/prism/pull/1044)

## 3.3.1 (2020-03-13)

## Fixed

- Prism is now able to correctly differentiate between a preflight request and a regular `OPTIONS` request [#1031](https://github.com/stoplightio/prism/pull/1031)
- Fixed a condition where Prism would ignore CLI flags in case the nor `Prefer` or Query String preferences were passed [#1034](https://github.com/stoplightio/prism/pull/1034)
- Created a specific error when a 200-299 response cannot be found for a successful request [#1035](https://github.com/stoplightio/prism/pull/1035)

## 3.3.0 (2020-03-10)

## Added

- Prism now supports sending its configuration parameters through the `Prefer` header [#984](https://github.com/stoplightio/prism/pull/984)
- Experimental Postman Collection support [#985](https://github.com/stoplightio/prism/pull/985)

## 3.2.9 (2020-02-19)

## Fixed

- Correctly evaluate the `ServerMatch` property so that Prism will prefer concrete matches over templated ones [#983](https://github.com/stoplightio/prism/pull/983)
- HTTP Client now correctly returns empty bodies [#993](https://github.com/stoplightio/prism/pull/993)

## 3.2.8 (2020-02-11)

## Fixed

- Correctly discriminate methods in the router when server is not defined [#969](https://github.com/stoplightio/prism/pull/969)

## 3.2.7 (2020-02-06)

## Fixed

- Removed double definition of the `ProblemJsonError` [#965](https://github.com/stoplightio/prism/pull/965)

## 3.2.6 (2020-02-03)

## Fixed

- Correctly set `access-control-expose-headers` headers for preflight and regular responses when CORS is enabled [#958](https://github.com/stoplightio/prism/pull/958)
- Prism public HTTP Client fixes and docs improvements [#959](https://github.com/stoplightio/prism/pull/959)

## 3.2.5 (2020-01-30)

## Fixed

- Correctly set `vary` and `access-control-request-headers` headers for preflight and regular responses when CORS is enabled

## 3.2.4 (2020-01-28)

## Changed

- Replaced Fastify HTTP server with its tinier counterpart: Micri [#927](https://github.com/stoplightio/prism/pull/927)

## Fixed

- Prism's proxy will now strip all the Hop By Hop headers [#921](https://github.com/stoplightio/prism/pull/921)
- Prism is now normalising the media types so that when looking for compatible contents charsets and other parameters are not taken in consideration [#944](https://github.com/stoplightio/prism/pull/944)
- Prism's external HTTP Client is now correctly constructing the internal log object [#952](https://github.com/stoplightio/prism/pull/952)

## 3.2.3 (2019-12-19)

## Fixed

- Prism will not coerce JSON Payloads anymore during the schema validation [#905](https://github.com/stoplightio/prism/pull/905)

## 3.2.2 (2019-12-13)

## Fixed

- Correctly handle the possibility of a body/headers generation failure [#875](https://github.com/stoplightio/prism/pull/875)
- Input validation errors should not trigger a `500` status code when the `--errors` flag is set to true [#892](https://github.com/stoplightio/prism/pull/892)

## 3.2.1 (2019-11-21)

## Fixed

- Put `chalk` as an explicit dependency in the CLI package [#854](https://github.com/stoplightio/prism/pull/854)
- Make sure callbacks work on `application/x-www-form-urlencoded` data [#856](https://github.com/stoplightio/prism/pull/856)

## 3.2.0 (2019-11-21)

## Added

- Support for encoding > allowReserved flag when validating application/x-www-form-urlencoded body [#630](https://github.com/stoplightio/prism/pull/630)
- Validating output status code against available response specs [#648](https://github.com/stoplightio/prism/pull/648)
- Support for Contract Testing [#650](https://github.com/stoplightio/prism/pull/650)
- The CLI will now propose operation paths with meaningful examples [#671](https://github.com/stoplightio/prism/pull/671)
- Prism reloads itself every time there are changes being made to the specified document [#689](https://github.com/stoplightio/prism/pull/689)
- Path parameters are now validated against schema [#702](https://github.com/stoplightio/prism/pull/702)
- The Test Harness framework now requires the `${document}` parameter explicitly [#720](https://github.com/stoplightio/prism/pull/720)
- Prism now includes a new `proxy` command that will validate the request coming in, send the request to an upstream server and then validate the response coming back [#669](https://github.com/stoplightio/prism/pull/669)
- Prism has values for path/query params bolded and in color [#743](https://github.com/stoplightio/prism/pull/743)
- The CLI now displays a timestamp for all the logged operations [#779](https://github.com/stoplightio/prism/pull/779)
- Prism has now support for OpenAPI 3.0 callbacks [#716](https://github.com/stoplightio/prism/pull/716)
- Prism body validator will now show allowed enum parameters in error messages [#828](https://github.com/stoplightio/prism/pull/828)

## Fixed

- Killing sub-process only if Prism is running in multi-process mode [#645](https://github.com/stoplightio/prism/pull/645)
- UUIDs are never generated as URNs [#661](https://github.com/stoplightio/prism/pull/661)
- Relative references for remote documents are now resolved correctly [#669](https://github.com/stoplightio/prism/pull/669)
- Core types are now correctly referenced in the HTTP package, restoring the type checks when using the package separately [#701](https://github.com/stoplightio/prism/pull/701)
- By upgrading Json Schema Faker to the latest version, now the schemas with `additionalProperties:false` / `additionalProperties:true` / `additionalProperties:object` will be correctly handled when dynamic mocking is enabled [#719](https://github.com/stoplightio/prism/pull/719)
- Making a request to an operation with a `deprecated` parameter is no longer causing Prism to return a 422 response [#721](https://github.com/stoplightio/prism/pull/721)
- The `access-control-allow-origin` header, when CORS is enabled, will now reflect the request origin _AND_ set the Credentials header [#797](https://github.com/stoplightio/prism/pull/797)
- When the request is missing the `Accept` header, Prism will now effectively treat it as a `*/*`, according to the respective CFP [#802](https://github.com/stoplightio/prism/pull/802)
- Prism will now passthrough as response anything that matches `text/*` instead of only `text/plain` [#796](https://github.com/stoplightio/prism/pull/796)

## 3.1.1 (2019-09-23)

## Fixed

- Prism is now giving precedence to `application/json` instead of using it as a "fallback" serializer, fixing some conditions where it wouldn't get triggered correctly. [#604](https://github.com/stoplightio/prism/pull/604)
- Prism is now taking in consideration the `required` properties for combined schemas (`oneOf, allOf`). This is coming through an update to the Json Schema Faker Library [#623](https://github.com/stoplightio/prism/pull/623)
- Prism will never have enough information to return a `403` status code; all these occurences have been now replaced with a `401` status code which is more appropriate [#625](https://github.com/stoplightio/prism/pull/625)
- Prism is now negotiating the error response dynamically based on the validation result (security or schema validation) instead of always returning a static order of responses [#628](https://github.com/stoplightio/prism/pull/628)
- Prism is now selecting proper serializer when Accept header contains content type which is missing in spec. This is a result of simplifying serializer selection approach. [#620](https://github.com/stoplightio/prism/pull/620)
- HEAD requests no longer fail with 406 Not Acceptable [#603](https://github.com/stoplightio/prism/pull/603)

## 3.1.0 (2019-09-03)

## Added

- Prism is now able to validate the security specification of the loaded document [#484](https://github.com/stoplightio/prism/pull/484)

## Fixed

- Prism is not crashing anymore when referencing the same model multiple times in the specification document [#552](https://github.com/stoplightio/prism/pull/552)
- Prism will now correctly use the `example` keyword for a Schema Object in OpenAPI 3.0 documents [#560](https://github.com/stoplightio/prism/pull/560)
- Prism won't return 406 when users request a `text/plain` response whose content is a primitive (string, number) [#560](https://github.com/stoplightio/prism/pull/560)
- Prism's router is now able to correctly handle a path ending with a parameter, such as `/test.{format}`, while it would previously not match with anything. [#561](https://github.com/stoplightio/prism/pull/561)
- Prism is correctly handling the `allowEmptyValue` property in OAS2 documents [#569](https://github.com/stoplightio/prism/pull/569)
- Prism is correctly handling the `csv` collection format argument property in OAS2 documents [#577](https://github.com/stoplightio/prism/pull/577)
- Prism is correctly returning the response when the request has `*/*` as Accept header [#578](https://github.com/stoplightio/prism/pull/578)
- Prism is correctly returning a single root node with the payload for XML data [#578](https://github.com/stoplightio/prism/pull/578)
- Prism is correctly returning payload-less responses #606

## 3.0.4 (2019-08-20)

## Added

- Prism is now returning CORS headers by default and responding to all the preflights requests. You can disable this behaviour by running Prism with the `--cors` flag set to false [#525](https://github.com/stoplightio/prism/pull/525)

## Fixed

- Prism now respects the `nullable` value for OpenAPI 3.x documents when generating examples [#506](https://github.com/stoplightio/prism/pull/506)
- Prism now loads correctly OpenAPI 3.x documents with `encodings` with non specified `style` property [#507](https://github.com/stoplightio/prism/pull/507)
- Prism got rid of some big internal dependencies that now aren't required anymore, making it faster and lighter. [#490](https://github.com/stoplightio/prism/pull/490)
- Prism now correctly validates OAS2 `application/x-www-urlencoded` (form data) params (#483)

## 3.0.3 (2019-07-25)

## Fixed

- Prism is now returning a `406` error instead of an empty response in case it is not able to find a response whose content type satisfies the provided `Accept` Header
- Prism now respects the `q` value in the `Accept` header to specify the content type preference
- Prism is now returning `text/plain` when the document does _not_ specify any Content Type for the examples
- Prism is now returning the example according to the `Accept` header for OAS2 documents
- Prism is now returning `404` instead of `500` in case the requested named example does not exist in the document

## Changed

- Prism HTTP Client is now adding 'user-agent' header with Prism/<<PRISM_VERSION>> as the value when making HTTP requests
- Prism is now using `yargs` for its command line interface, replacing oclif.

## 3.0.1 (2019-07-16)

## Fixed

- Fixed an error in the JSON Path bundling for NPM Package download

## 3.0.0 (2019-07-16)

This is nothing more than the beta 6 rebranded.

## 3.0.0-beta.6 (2019-07-12)

### Fixed

- Prism now loads correctly files from the internet with urls using query parameters [#452](https://github.com/stoplightio/prism/issues/452)
- Prism now correctly respects the `required` property in OpenAPI 2 body parameters [#450](https://github.com/stoplightio/prism/issues/450)
- Prism now validates any payload, as long it has a schema and it's parsable [#446](https://github.com/stoplightio/prism/issues/446)
- Prism now will tell you explicitly when a response has been constructed from a `default` response definition [#445](https://github.com/stoplightio/prism/issues/445)

## 3.0.0-beta.5 (2019-07-09)

### Features

- Internal refactoring: Prism validation process is now completely sync [#400](https://github.com/stoplightio/prism/issues/400)

## 3.0.0-beta.3 (2019-07-05)

### Features

- Prism examples generator supports `x-faker` extensions [#384 — thanks @vanhoofmaarten!](https://github.com/stoplightio/prism/issues/vanhoofmaarten!)
- Documentation reorganisation [#393](https://github.com/stoplightio/prism/issues/393)

## 3.0.0-beta.3 (2019-07-01)

### Features

- Introduced Azure Pipelines to make sure Prism works on Windows [#388](https://github.com/stoplightio/prism/issues/388)
- Prism has now a diagram in the readme that shows you the mocker flow [#386](https://github.com/stoplightio/prism/issues/386)
- Several improvements to the logging of the Http Mocker [#382](https://github.com/stoplightio/prism/issues/382)
- Our `application/vnd+problem.json` messages have been improved [#370](https://github.com/stoplightio/prism/issues/370)

### Fixed

- Prism is now able to parse HTTP FormData payloads [#381](https://github.com/stoplightio/prism/issues/381)

## 3.0.0-beta.1 (2019-06-22)

### Features

- Prism now works correctly on Windows thanks to some internal libraries updates [#374](https://github.com/stoplightio/prism/issues/374)
- Prism 3 has now a Docker Image; you can try it at `stoplight/prism:3`

### Fixed

- Static JSON Schema examples generator gives precendece to `default` over `examples` [#373](https://github.com/stoplightio/prism/issues/373)

## 3.0.0-beta.1 (2019-06-18)

### Features

- Prism is now logging all the negotiator phases for a better observability [#323](https://github.com/stoplightio/prism/issues/323)

- The HTTP Client API has been documented [#355](https://github.com/stoplightio/prism/issues/355)

### Fixed

- Prism's build process in TypeScript has been revisited [#356](https://github.com/stoplightio/prism/issues/356)

## 3.0.0-alpha.16 (2019-06-17)

### Features

- Prism can now validate servers [#351](https://github.com/stoplightio/prism/issues/351)

## 3.0.0-alpha.15 (2019-06-14)

### Fixed

- Prism's build process received some tweaks, but there's more work to do [#352](https://github.com/stoplightio/prism/issues/352)

### Features

- Prism now has got a static example fallback in case the `dynamic` flag is not enabled [#347](https://github.com/stoplightio/prism/issues/347)

## 3.0.0-alpha.14 (2019-06-11)

### Fixed

- Prism is now handling the fact that HTTP headers are case insensitive [#338](https://github.com/stoplightio/prism/issues/338)
- Prism is now normalising OAS2/3 schemas improving and simplyfing the validation capabilites [#338](https://github.com/stoplightio/prism/issues/338)

## 3.0.0-alpha.13 (2019-06-09)

### Fixed

- Prism is not able to correctly handle the Content Type header [#344](https://github.com/stoplightio/prism/issues/344)

### Features

- Prism CLI has now a new CLI option to specify the IP Address where it will listen connections for [#340](https://github.com/stoplightio/prism/issues/340)

## 3.0.0-alpha.12 (2019-06-04)

### Fixed

- Fixed the security issue intrisic in Axios by updating its dependency in the project [#334](https://github.com/stoplightio/prism/issues/334)
- Fix a bug where paremeters where undetected, returning a REQUIERD error [#325](https://github.com/stoplightio/prism/issues/325)

### Features

- Respect the `Accept` header when requesting content to Prism [#333](https://github.com/stoplightio/prism/issues/333)
- Create a LICENSE file for the project [#330](https://github.com/stoplightio/prism/issues/330)
- Add new GitHub ISSUES template files for the project [#326](https://github.com/stoplightio/prism/issues/326)
- Decouple payload generation from its serialisation [#322](https://github.com/stoplightio/prism/issues/322)

## 3.0.0-alpha.11 (2019-05-24)

### Fixed

- a bug where http operations were not resolved ([6aee679](https://github.com/stoplightio/prism/commit/6aee679))
- add missing referenced project ([7621f8a](https://github.com/stoplightio/prism/commit/7621f8a))
- add tsconfig paths to make the CLI work natively in TS SL-2369 ([#219](https://github.com/stoplightio/prism/issues/219)) ([30298a9](https://github.com/stoplightio/prism/commit/30298a9))
- correctly install dependencies ([#302](https://github.com/stoplightio/prism/issues/302)) ([d3de5b1](https://github.com/stoplightio/prism/commit/d3de5b1))
- dependencies ([ebd2536](https://github.com/stoplightio/prism/commit/ebd2536))
- do not overwrite the default config object ([bcb20f5](https://github.com/stoplightio/prism/commit/bcb20f5))
- do not throw when you can't find an example ([06f9435](https://github.com/stoplightio/prism/commit/06f9435))
- error serialisation SO-195 ([#274](https://github.com/stoplightio/prism/issues/274)) ([1199919](https://github.com/stoplightio/prism/commit/1199919))
- get rid of ajv console warn ([b11cd48](https://github.com/stoplightio/prism/commit/b11cd48))
- get rid of resolutions ([#289](https://github.com/stoplightio/prism/issues/289)) ([758cbfa](https://github.com/stoplightio/prism/commit/758cbfa))
- it's ok if we do not have examples or schemas ([5a93f1d](https://github.com/stoplightio/prism/commit/5a93f1d))
- look for 422 for invalid requests ([#278](https://github.com/stoplightio/prism/issues/278)) ([7a1c073](https://github.com/stoplightio/prism/commit/7a1c073))
- make jest faster in startup and runtime ([d9b6c2a](https://github.com/stoplightio/prism/commit/d9b6c2a))
- make sure http download works ([#276](https://github.com/stoplightio/prism/issues/276)) ([01828f3](https://github.com/stoplightio/prism/commit/01828f3))
- OAS3 integration tests and fixes SO-103 ([#253](https://github.com/stoplightio/prism/issues/253)) ([930d29e](https://github.com/stoplightio/prism/commit/930d29e))
- prism forwarder can work without an API in place [SL-1619][7c61c62](https://github.com/stoplightio/prism/commit/7c61c62)
- Prism should read yml files too SO-200 ([#299](https://github.com/stoplightio/prism/issues/299)) ([cbc96b2](https://github.com/stoplightio/prism/commit/cbc96b2))
- prism-server should always return a response ([e72c6bf](https://github.com/stoplightio/prism/commit/e72c6bf))
- put oclif only where it is needed ([68bf27d](https://github.com/stoplightio/prism/commit/68bf27d))
- remove explicit dependency ([fd2885f](https://github.com/stoplightio/prism/commit/fd2885f))
- remove nvmrc ([3eaee34](https://github.com/stoplightio/prism/commit/3eaee34))
- remove other packages and update ([9eb9bfa](https://github.com/stoplightio/prism/commit/9eb9bfa))
- require the correct code ([2e6d242](https://github.com/stoplightio/prism/commit/2e6d242))
- running `prism` cli threw exception ([#190](https://github.com/stoplightio/prism/issues/190)) ([1893ccc](https://github.com/stoplightio/prism/commit/1893ccc))
- schema faker fix ([#195](https://github.com/stoplightio/prism/issues/195)) ([5889cc7](https://github.com/stoplightio/prism/commit/5889cc7))
- separate config concept sl-2191 ([96e45fd](https://github.com/stoplightio/prism/commit/96e45fd))
- SL-2028 fixed absolute paths handling ([#197](https://github.com/stoplightio/prism/issues/197)) ([8d668a1](https://github.com/stoplightio/prism/commit/8d668a1))
- SL-2030 disabled fastify's body serializing ([#192](https://github.com/stoplightio/prism/issues/192)) ([7262c5f](https://github.com/stoplightio/prism/commit/7262c5f))
- SL-2192 stringify examples ([#205](https://github.com/stoplightio/prism/issues/205)) ([bbf6492](https://github.com/stoplightio/prism/commit/bbf6492))
- SL-2377 host/forwarded headers support ([#249](https://github.com/stoplightio/prism/issues/249)) ([f8a1131](https://github.com/stoplightio/prism/commit/f8a1131))
- SL-80 fixed router logic ([7a3d35e](https://github.com/stoplightio/prism/commit/7a3d35e))
- SL-80 fixed test ([d1c8974](https://github.com/stoplightio/prism/commit/d1c8974))
- SL-80 more reasonable examples ([68025c6](https://github.com/stoplightio/prism/commit/68025c6))
- SL-82 created common args/flags place for cli ([9f53eef](https://github.com/stoplightio/prism/commit/9f53eef))
- SO-80 added integration test ([b1936e1](https://github.com/stoplightio/prism/commit/b1936e1))
- SO-80 added missing file ([ff94b7b](https://github.com/stoplightio/prism/commit/ff94b7b))
- SO-80 default to empty body, match even if no servers ([c92e487](https://github.com/stoplightio/prism/commit/c92e487))
- SO-80 fixed example ([b7afa9b](https://github.com/stoplightio/prism/commit/b7afa9b))
- SO-80 path fix ([04cba58](https://github.com/stoplightio/prism/commit/04cba58))
- SO-80 updated test name ([d67d04a](https://github.com/stoplightio/prism/commit/d67d04a))
- SO-82 fixed tests ([545294a](https://github.com/stoplightio/prism/commit/545294a))
- sync stuff should be sync ([b4b3e8b](https://github.com/stoplightio/prism/commit/b4b3e8b))
- try to generate an example only if the schema is provided ([b9b3310](https://github.com/stoplightio/prism/commit/b9b3310))
- try to publish first, and then publish binaries ([#318](https://github.com/stoplightio/prism/issues/318)) ([1d8618c](https://github.com/stoplightio/prism/commit/1d8618c))
- upgrade graphite ([#308](https://github.com/stoplightio/prism/issues/308)) ([4b6458a](https://github.com/stoplightio/prism/commit/4b6458a))
- use rootDirs and outDir to help oclif config find source commands ([964b043](https://github.com/stoplightio/prism/commit/964b043))
- **mocker:** a bug where Content-Type was set but we didn't find it ([b5a9dd8](https://github.com/stoplightio/prism/commit/b5a9dd8))
- **validator:** a bug where fastify omits hasOwnProperty in query obj ([726fcff](https://github.com/stoplightio/prism/commit/726fcff))
- **validator:** a bug where json object failed to parse ([fbdab3c](https://github.com/stoplightio/prism/commit/fbdab3c))

### Features

- --dynamic flag for CLI SO-217 ([#301](https://github.com/stoplightio/prism/issues/301)) ([f1f27cf](https://github.com/stoplightio/prism/commit/f1f27cf))
- Add binary script SO-162 ([#271](https://github.com/stoplightio/prism/issues/271)) ([3b6b508](https://github.com/stoplightio/prism/commit/3b6b508))
- add changelog when releasing ([#317](https://github.com/stoplightio/prism/issues/317)) ([df4aa95](https://github.com/stoplightio/prism/commit/df4aa95))
- add install script ([#286](https://github.com/stoplightio/prism/issues/286)) ([766297d](https://github.com/stoplightio/prism/commit/766297d))
- add npm token to file to publish ([0410836](https://github.com/stoplightio/prism/commit/0410836))
- add oas3 plugin ([58ebc4c](https://github.com/stoplightio/prism/commit/58ebc4c))
- CLI show endpoints and status SO-201 ([#296](https://github.com/stoplightio/prism/issues/296)) ([d60830b](https://github.com/stoplightio/prism/commit/d60830b))
- Implement header mocking functionality SO-227 ([#314](https://github.com/stoplightio/prism/issues/314)) ([5f0c0ba](https://github.com/stoplightio/prism/commit/5f0c0ba))
- **http-forwarder:** add support for timeout and cancelToken ([#309](https://github.com/stoplightio/prism/issues/309)) ([8e1db46](https://github.com/stoplightio/prism/commit/8e1db46))
- add some unit tests ([46ac012](https://github.com/stoplightio/prism/commit/46ac012))
- add tests and modify error response message ([73db545](https://github.com/stoplightio/prism/commit/73db545))
- do not build ([0a4a814](https://github.com/stoplightio/prism/commit/0a4a814))
- GitHub Releases and binary uploads ([#279](https://github.com/stoplightio/prism/issues/279)) ([388df6d](https://github.com/stoplightio/prism/commit/388df6d))
- integrate Prism with Graph (WIP) ([f4d8b1e](https://github.com/stoplightio/prism/commit/f4d8b1e))
- release ([#294](https://github.com/stoplightio/prism/issues/294)) ([a09dfb3](https://github.com/stoplightio/prism/commit/a09dfb3))
- release manually ([ab2f06e](https://github.com/stoplightio/prism/commit/ab2f06e))
- release prism 3.x alpha with required scripts ([6864986](https://github.com/stoplightio/prism/commit/6864986))
- revisit the build process ([d7d307f](https://github.com/stoplightio/prism/commit/d7d307f))
- SL-2035 cli url spec ([#200](https://github.com/stoplightio/prism/issues/200)) ([76ae24f](https://github.com/stoplightio/prism/commit/76ae24f))
- SL-2037 forbidding dirs to be supplied to --spec cli's arg ([#198](https://github.com/stoplightio/prism/issues/198)) ([05c4b3c](https://github.com/stoplightio/prism/commit/05c4b3c))
- SL-82 split mock and server commands ([4ba0c28](https://github.com/stoplightio/prism/commit/4ba0c28))
- SL-82 split mock and server commands ([ddf87bd](https://github.com/stoplightio/prism/commit/ddf87bd))
- SO-141 Problem+Json for error messages SO-141 ([#270](https://github.com/stoplightio/prism/issues/270)) ([a5a3a67](https://github.com/stoplightio/prism/commit/a5a3a67))
- support OAS json schema formats ([7c3c4f5](https://github.com/stoplightio/prism/commit/7c3c4f5))
- throw exception when path is matched but method is not allowed. ([de32fb0](https://github.com/stoplightio/prism/commit/de32fb0))
- upgrade ts ([2bc6638](https://github.com/stoplightio/prism/commit/2bc6638))
- **cli:** add validation support and resource resolution ([14b4b7d](https://github.com/stoplightio/prism/commit/14b4b7d))
- **config:** add functional tests to meet AC ([32f486b](https://github.com/stoplightio/prism/commit/32f486b))
- **core:** implement a graph resource loader ([431789e](https://github.com/stoplightio/prism/commit/431789e))
- **httpConfig:** add default config support and unit test ([4f0a062](https://github.com/stoplightio/prism/commit/4f0a062))
- **mocker:** fix tests ([27b74a3](https://github.com/stoplightio/prism/commit/27b74a3))
- **mocker:** fixed test ([08c4d7f](https://github.com/stoplightio/prism/commit/08c4d7f))
- **mocker:** integrate mocker with business logic ([e4513c5](https://github.com/stoplightio/prism/commit/e4513c5))
- **mocker:** remove httpRequest from method signature ([5163835](https://github.com/stoplightio/prism/commit/5163835))
- **mocker:** take http request into account ([85f1bc0](https://github.com/stoplightio/prism/commit/85f1bc0))
- **negotiator:** add remaining negotiator tests ([944531f](https://github.com/stoplightio/prism/commit/944531f))
- **negotiator:** add unit tests for helpers ([45603e9](https://github.com/stoplightio/prism/commit/45603e9))
- **negotiator:** WIP tests ([3776042](https://github.com/stoplightio/prism/commit/3776042))
- **router:** add matchPath function ([7292957](https://github.com/stoplightio/prism/commit/7292957))
- **router:** add two more corner case tests for clarification ([23dc242](https://github.com/stoplightio/prism/commit/23dc242))
- **router:** implemented and unit tested router ([07a31a1](https://github.com/stoplightio/prism/commit/07a31a1))
- **router:** lint and autofix all style issues ([9eb501c](https://github.com/stoplightio/prism/commit/9eb501c))
- **router:** made baseUrl optional to ignore server matching ([91669a8](https://github.com/stoplightio/prism/commit/91669a8))
- **router:** make disambiguateMatches() private ([91c2a7b](https://github.com/stoplightio/prism/commit/91c2a7b))
- **router:** throw exceptions instead return null ([ebb6d2c](https://github.com/stoplightio/prism/commit/ebb6d2c))
- **router:** WIP add disambiguation and server matching ([c778ae6](https://github.com/stoplightio/prism/commit/c778ae6))
- **router:** WIP dummy router implementation and specs ([2dc3f8b](https://github.com/stoplightio/prism/commit/2dc3f8b))
- **sampler:** add basic class structure and basic implementation ([2c31635](https://github.com/stoplightio/prism/commit/2c31635))

<!-- markdown-link-check-enable-->
