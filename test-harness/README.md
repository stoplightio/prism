## Generating binaries

For anything to work, the binaries have to be generated first with: `yarn build.binaries`. This will generate three binaries.

### Alternatively, run any of the following:

1. `yarn build.binary` will assume the host machine
2. `HOST=host yarn build.binary` will generate a binary for the current host machine
3. `HOST=node10-linux-x64 yarn build.binary` will generate a binary for node10-linux-x64

*Before running any of the above, make sure that `yarn` was run beforehand*. If `yarn` was not run, you might experience `Error: command mock not found` issue.

## To record gold master files:

1. `SPEC=./examples/petstore.oas2.json BINARY=./cli-binaries/prism-cli-linux yarn run.binary` - this will start up prism binary. When doing `yarn run.binary`, both `SPEC` and `BINARY` have to be defined.
2. in another terminal window: `node test-harness/createMasterFiles.js` - this will use requests definitions from `requests.js` and save master files under `/gold-master-files`

Gold master files contain data about both request and response.

##  To run tests, run any of the following:

*There is no need to manually start prism binary to run tests.*

1. `yarn test.binary`
2. `SPEC=./examples/petstore.oas2.json BINARY=./cli-binaries/prism-cli-linux yarn test.binary`
3. `SPEC=./examples/petstore.oas2.json,./examples/petstore.oas3.json BINARY=./cli-binaries/prism-cli-linux yarn test.coverage --verbose` (`SPEC` can take comma delimited paths to specs)
4. `RUN_V2_TESTS=1 SPEC=./examples/petstore.oas2.json,./examples/petstore.oas3.json yarn test.binary`

Adding `RUN_V2_TESTS=1` will additionally run the tests against Prism v2 binary. Please run `yarn download.prism.v2` first.

For now, when running with `SPEC=petstore.oas3.json`, some of the tests will fail. This is intentional - [TODO].

When doing `yarn test.binary`, the envs are optional, they have defaults.

1. `SPEC` defaults to using `petstore.oas2.json`
2. `BINARY` defaults to using `prism-cli-linux`
