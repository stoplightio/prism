## Generating binaries

For anything to work, the binaries have to be generated first with: `yarn build.binaries`. This will generate three binaries.

### Alternatively, run any of the following:

1. `yarn build.binary` will assume the host machine
2. `HOST=host yarn build.binary` will generate a binary for the current host machine
3. `HOST=node10-linux-x64 yarn build.binary` will generate a binary for node10-linux-x64

Before running any of the above, please make sure that the dependencies (from `package.json`) are installed.
You can do so by running `yarn` or `npm install`.
If the dependencies were not installed, you might experience `Error: command mock not found` issue.

`HOST` variable is used to specify what binary we want to build.
`HOST` might be set to anything that is considered a target in `pkg` [supports](https://github.com/zeit/pkg#targets).

## To run tests, run any of the following:

_There is no need to manually start prism binary to run tests._

1. `yarn test.binary`
2. `SPEC=./examples/petstore.oas2.json BINARY=./cli-binaries/prism-cli-linux yarn test.binary`
3. `SPEC=./examples/petstore.oas2.json,./examples/petstore.oas3.json BINARY=./cli-binaries/prism-cli-linux yarn test.binary`
4. `RUN_V2_TESTS=1 SPEC=./examples/petstore.oas2.json,./examples/petstore.oas3.json yarn test.binary`

> `SPEC` can take comma delimited paths to specs

Adding `RUN_V2_TESTS=1` will additionally run the tests against `prism` version two binary.
Please make sure that `prism` version 2 is available in the project root directory beforehand.
If you have `prism` version 2 installed already, you can symlink the executable.
Also, you can just run `curl -L https://github.com/stoplightio/prism/releases/download/v2.0.17/prism_linux_amd64 -o prism && chmod +x ./prism`
to have `prism` version 2 downloaded to the project root directory.

When doing `yarn test.binary`, the envs are optional, they have defaults.

1. `SPEC` defaults to using `petstore.oas2.json`
2. `BINARY` defaults to using `prism-cli-linux`

## To record gold master files:

1. `SPEC=./examples/petstore.oas2.json BINARY=./cli-binaries/prism-cli-linux yarn run.binary` - this will start up prism binary. When doing `yarn run.binary`, both `SPEC` and `BINARY` have to be defined.
2. in another terminal window: `node test-harness/createMasterFiles.js` - this will use requests definitions from `requests.js` and save master files under `/gold-master-files`

Gold master files contain data about both request and response.

## Specifying a port for prism

When doing `yarn test.binary`, `yarn run.binary` or `yarn run.binary.v2`, you can specify `PRISM_PORT` environment variable.
So, for example, you can run `PRISM_PORT=8090 SPEC=./examples/petstore.oas2.json,./examples/petstore.oas3.json BINARY=./cli-binaries/prism-cli-linux yarn test.binary`
to have prism running on port `8090`. If not specified, prism will run on port `4010`.
