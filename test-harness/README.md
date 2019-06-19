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

Start Prism with the target file you'd like and then run the command

1. `yarn test.binary`
2. `SPEC=./examples/petstore.oas2.json yarn test.binary`
3. `SPEC=./examples/petstore.oas2.json PRISM_PORT=4011 yarn test.binary`

> `SPEC` can take comma delimited paths to specs


When doing `yarn test.binary`, the envs are optional, they have defaults.

1. `SPEC` defaults to using `petstore.oas2.json`
2. `PRISM_PORT` defaults to using `4010`

## To record gold master files:

1. Run the Prism binary with the target file you want to record
2. in another terminal window: `node test-harness/createMasterFiles.js` - this will use requests definitions from `requests.js` and save master files under `/gold-master-files`

Gold master files contain data about both request and response.
