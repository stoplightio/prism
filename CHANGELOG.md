# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

# Unreleased

## Fixed

- Correctly evaluate the `ServerMatch` property so that Prism will prefer concrete matches over templated ones [#983](https://github.com/stoplightio/prism/pull/983)
- HTTP Client now correctly return empty bodies [#993](https://github.com/stoplightio/prism/pull/993)

# 3.2.8 (2020-02-11)

## Fixed

- Correctly discriminate methods in the router when server is not defined [#969](https://github.com/stoplightio/prism/pull/969)

# 3.2.7 (2020-02-06)

## Fixed

- Removed double definition of the `ProblemJsonError` [#965](https://github.com/stoplightio/prism/pull/965)

# 3.2.6 (2020-02-03)

## Fixed

- Correctly set `access-control-expose-headers` headers for preflight and regular responses when CORS is enabled [#958](https://github.com/stoplightio/prism/pull/958)
- Prism public HTTP Client fixes and docs improvements [#959](https://github.com/stoplightio/prism/pull/959)

# 3.2.5 (2020-01-30)

## Fixed

- Correctly set `vary` and `access-control-request-headers` headers for preflight and regular responses when CORS is enabled

# 3.2.4 (2020-01-28)

## Changed

- Replaced Fastify HTTP server with its tinier counterpart: Micri [#927](https://github.com/stoplightio/prism/pull/927)

## Fixed

- Prism's proxy will now strip all the Hop By Hop headers [#921](https://github.com/stoplightio/prism/pull/921)
- Prism is now normalising the media types so that when looking for compatible contents charsets and other parameters are not taken in consideration [#944](https://github.com/stoplightio/prism/pull/944)
- Prism's external HTTP Client is now correctly constructing the internal log object [#952](https://github.com/stoplightio/prism/pull/952)

# 3.2.3 (2019-12-19)

## Fixed

- Prism will not coerce JSON Payloads anymore during the schema validation [#905](https://github.com/stoplightio/prism/pull/905)

# 3.2.2 (2019-12-13)

## Fixed

- Correctly handle the possibility of a body/headers generation failure [#875](https://github.com/stoplightio/prism/pull/875)
- Input validation errors should not trigger a `500` status code when the `--errors` flag is set to true [#892](https://github.com/stoplightio/prism/pull/892)

# 3.2.1 (2019-11-21)

## Fixed

- Put `chalk` as an explicit dependency in the CLI package [#854](https://github.com/stoplightio/prism/pull/854)
- Make sure callbacks work on `application/x-www-form-urlencoded` data [#856](https://github.com/stoplightio/prism/pull/856)

# 3.2.0 (2019-11-21)

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

# 3.1.1 (2019-09-23)

## Fixed

- Prism is now giving precedence to `application/json` instead of using it as a "fallback" serializer, fixing some conditions where it wouldn't get triggered correctly. [#604](https://github.com/stoplightio/prism/pull/604)
- Prism is now taking in consideration the `required` properties for combined schemas (`oneOf, allOf`). This is coming through an update to the Json Schema Faker Library [#623](https://github.com/stoplightio/prism/pull/623)
- Prism will never have enough information to return a `403` status code; all these occurences have been now replaced with a `401` status code which is more appropriate [#625](https://github.com/stoplightio/prism/pull/625)
- Prism is now negotiating the error response dynamically based on the validation result (security or schema validation) instead of always returning a static order of responses [#628](https://github.com/stoplightio/prism/pull/628)
- Prism is now selecting proper serializer when Accept header contains content type which is missing in spec. This is a result of simplifying serializer selection approach. [#620](https://github.com/stoplightio/prism/pull/620)
- HEAD requests no longer fail with 406 Not Acceptable [#603](https://github.com/stoplightio/prism/pull/603)

# 3.1.0 (2019-09-03)

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

# 3.0.4 (2019-08-20)

## Added

- Prism is now returning CORS headers by default and responding to all the preflights requests. You can disable this behaviour by running Prism with the `--cors` flag set to false [#525](https://github.com/stoplightio/prism/pull/525)

## Fixed

- Prism now respects the `nullable` value for OpenAPI 3.x documents when generating examples [#506](https://github.com/stoplightio/prism/pull/506)
- Prism now loads correctly OpenAPI 3.x documents with `encodings` with non specified `style` property [#507](https://github.com/stoplightio/prism/pull/507)
- Prism got rid of some big internal dependencies that now aren't required anymore, making it faster and lighter. [#490](https://github.com/stoplightio/prism/pull/490)
- Prism now correctly validates OAS2 `application/x-www-urlencoded` (form data) params (#483)

# 3.0.3 (2019-07-25)

## Fixed

- Prism is now returning a `406` error instead of an empty response in case it is not able to find a response whose content type satisfies the provided `Accept` Header
- Prism now respects the `q` value in the `Accept` header to specify the content type preference
- Prism is now returning `text/plain` when the document does _not_ specify any Content Type for the examples
- Prism is now returning the example according to the `Accept` header for OAS2 documents
- Prism is now returning `404` instead of `500` in case the requested named example does not exist in the document

## Changed

- Prism HTTP Client is now adding 'user-agent' header with Prism/<<PRISM_VERSION>> as the value when making HTTP requests
- Prism is now using `yargs` for its command line interface, replacing oclif.

# 3.0.1 (2019-07-16)

## Fixed

- Fixed an error in the JSON Path bundling for NPM Package download

# 3.0.0 (2019-07-16)

This is nothing more than the beta 6 rebranded.

# 3.0.0-beta.6 (2019-07-12)

### Fixed

- Prism now loads correctly files from the internet with urls using query parameters [#452](https://github.com/stoplightio/prism/issues/452)
- Prism now correctly respects the `required` property in OpenAPI 2 body parameters [#450](https://github.com/stoplightio/prism/issues/450)
- Prism now validates any payload, as long it has a schema and it's parsable [#446](https://github.com/stoplightio/prism/issues/446)
- Prism now will tell you explicitly when a response has been constructed from a `default` response definition [#445](https://github.com/stoplightio/prism/issues/445)

# 3.0.0-beta.5 (2019-07-09)

### Features

- Internal refactoring: Prism validation process is now completely sync [#400](https://github.com/stoplightio/prism/issues/400)

# 3.0.0-beta.3 (2019-07-05)

### Features

- Prism examples generator supports `x-faker` extensions [#384 — thanks @vanhoofmaarten!](https://github.com/stoplightio/prism/issues/vanhoofmaarten!)
- Documentation reorganisation [#393](https://github.com/stoplightio/prism/issues/393)

# 3.0.0-beta.3 (2019-07-01)

### Features

- Introduced Azure Pipelines to make sure Prism works on Windows [#388](https://github.com/stoplightio/prism/issues/388)
- Prism has now a diagram in the readme that shows you the mocker flow [#386](https://github.com/stoplightio/prism/issues/386)
- Several improvements to the logging of the Http Mocker [#382](https://github.com/stoplightio/prism/issues/382)
- Our `application/vnd+problem.json` messages have been improved [#370](https://github.com/stoplightio/prism/issues/370)

### Fixed

- Prism is now able to parse HTTP FormData payloads [#381](https://github.com/stoplightio/prism/issues/381)

# 3.0.0-beta.1 (2019-06-22)

### Features

- Prism now works correctly on Windows thanks to some internal libraries updates [#374](https://github.com/stoplightio/prism/issues/374)
- Prism 3 has now a Docker Image; you can try it at `stoplight/prism:3`

### Fixed

- Static JSON Schema examples generator gives precendece to `default` over `examples` [#373](https://github.com/stoplightio/prism/issues/373)

# 3.0.0-beta.1 (2019-06-18)

### Features

- Prism is now logging all the negotiator phases for a better observability [#323](https://github.com/stoplightio/prism/issues/323)

- The HTTP Client API has been documented [#355](https://github.com/stoplightio/prism/issues/355)

### Fixed

- Prism's build process in TypeScript has been revisited [#356](https://github.com/stoplightio/prism/issues/356)

# 3.0.0-alpha.16 (2019-06-17)

### Features

- Prism can now validate servers [#351](https://github.com/stoplightio/prism/issues/351)

# 3.0.0-alpha.15 (2019-06-14)

### Fixed

- Prism's build process received some tweaks, but there's more work to do [#352](https://github.com/stoplightio/prism/issues/352)

### Features

- Prism now has got a static example fallback in case the `dynamic` flag is not enabled [#347](https://github.com/stoplightio/prism/issues/347)

# 3.0.0-alpha.14 (2019-06-11)

### Fixed

- Prism is now handling the fact that HTTP headers are case insensitive [#338](https://github.com/stoplightio/prism/issues/338)
- Prism is now normalising OAS2/3 schemas improving and simplyfing the validation capabilites [#338](https://github.com/stoplightio/prism/issues/338)

# 3.0.0-alpha.13 (2019-06-09)

### Fixed

- Prism is not able to correctly handle the Content Type header [#344](https://github.com/stoplightio/prism/issues/344)

### Features

- Prism CLI has now a new CLI option to specify the IP Address where it will listen connections for [#340](https://github.com/stoplightio/prism/issues/340)

# 3.0.0-alpha.12 (2019-06-04)

### Fixed

- Fixed the security issue intrisic in Axios by updating its dependency in the project [#334](https://github.com/stoplightio/prism/issues/334)
- Fix a bug where paremeters where undetected, returning a REQUIERD error [#325](https://github.com/stoplightio/prism/issues/325)

### Features

- Respect the `Accept` header when requesting content to Prism [#333](https://github.com/stoplightio/prism/issues/333)
- Create a LICENSE file for the project [#330](https://github.com/stoplightio/prism/issues/330)
- Add new GitHub ISSUES template files for the project [#326](https://github.com/stoplightio/prism/issues/326)
- Decouple payload generation from its serialisation [#322](https://github.com/stoplightio/prism/issues/322)

# 3.0.0-alpha.11 (2019-05-24)

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
