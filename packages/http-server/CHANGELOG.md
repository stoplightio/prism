# Changelog

## [5.6.0](https://github.com/stoplightio/prism/compare/v5.5.4...v5.6.0) (2024-03-18)


### Features

* 1813 start using 415 code for invalid content-types instead constantly inferring it ([df475fc](https://github.com/stoplightio/prism/commit/df475fcb67608428c143b3e6a988d95a1ef1fd3e))
* adds more standard compliant request body handling ([#2260](https://github.com/stoplightio/prism/issues/2260)) ([3b56cb7](https://github.com/stoplightio/prism/commit/3b56cb72f41d106cbcc95bb7c27711a3c05c6298))
* support circular refs ([#1835](https://github.com/stoplightio/prism/issues/1835)) ([d287dd7](https://github.com/stoplightio/prism/commit/d287dd700c2597c0b20214c8340680dd42e20085))


### Bug Fixes

* **http-server:** discard request body if the content-length header i… ([#2103](https://github.com/stoplightio/prism/issues/2103)) ([c172f42](https://github.com/stoplightio/prism/commit/c172f42c89d67c3963eb9962d0550d5126756d34))
* update http-spec ([#2037](https://github.com/stoplightio/prism/issues/2037)) ([72d6882](https://github.com/stoplightio/prism/commit/72d6882bc39a673e65b1fc10ff88d3581b838dca))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @stoplight/prism-core bumped from ^5.5.4 to ^5.6.0
    * @stoplight/prism-http bumped from ^5.5.4 to ^5.6.0
