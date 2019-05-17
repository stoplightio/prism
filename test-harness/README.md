This is **Work In Progress**.

> For anything to work, the binaries have to be generated first with: `yarn build.binaries`

## To record gold master files:

1. `SPEC=petstore.oas2.json BINARY=prism-cli-linux yarn run.binary` - this will start up prism binary. When doing `yarn run.binary`, both `SPEC` and `BINARY` have to be defined.
2. in another terminal window: `node test-harness/createMasterFiles.js` - this will use requests definitions from `requests.js` and save master files under `/gold-master-files`

Gold master files contain data about both request and response.

##  To run tests:

*There is no need to manually start prism binary to run tests.*

`yarn test.binary`
or
`SPEC=petstore.oas2.json BINARY=prism-cli-linux yarn test.binary`

For now, when running with `SPEC=petstore.oas3.json`, some of the tests will fail. This is intentional - [TODO].

When doing `yarn test.binary`, the envs are optional, they have defaults.

1. `SPEC` defaults to `petstore.oas2.json`
2. `BINARY` defaults to `prism-cli-linux`
