# prism-cli

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prism-cli.svg)](https://npmjs.org/package/@stoplight/prism-cli)
[![Downloads/week](https://img.shields.io/npm/dw/prism-cli.svg)](https://npmjs.org/package/@stoplight/prism-cli)
[![License](https://img.shields.io/npm/l/prism-cli.svg)](https://github.com/stoplightio/prism/blob/master/package.json)

<!-- toc -->
* [prism-cli](#prism-cli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @stoplight/prism-cli
$ prism COMMAND
running command...
$ prism (-v|--version|version)
@stoplight/prism-cli/3.0.0-beta.1 darwin-x64 node-v12.4.0
$ prism --help [COMMAND]
USAGE
  $ prism COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`prism help [COMMAND]`](#prism-help-command)
* [`prism mock SPEC`](#prism-mock-spec)

## `prism help [COMMAND]`

display help for prism

```
USAGE
  $ prism help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_

## `prism mock SPEC`

Start a mock server with the given spec file

```
USAGE
  $ prism mock SPEC

ARGUMENTS
  SPEC  Path to a spec file. Can be both a file or a fetchable resource on the web

OPTIONS
  -d, --dynamic       Dynamically generate examples.
  -h, --host=host     [default: 127.0.0.1] Host that Prism will listen to.
  -m, --multiprocess  Fork the http server from the CLI
  -p, --port=port     (required) [default: 4010] Port that Prism will run on.
```

_See code: [dist/commands/mock.ts](https://github.com/stoplightio/prism/blob/v3.0.0-beta.1/dist/commands/mock.ts)_
<!-- commandsstop -->

## Running in production

When running in development mode (which happens when the `NODE_ENV` environment variable is not set to `production`) or the `-m` flag is set to false, both the HTTP Server and the CLI (which is responsible of parsing and showing the received logs on the screen) will run within the same process.

Processing logs slows down the process significantly. If you're planning to use the CLI in production (for example in a Docker Container) we recommend to run the CLI with the `-m` flag or set the `NODE_ENV` variable to `production`. In this way, the CLI and the HTTP server will run on two different processes, so that logs processing, parsing and printing does not slow down the http requests processing.

## Development

### Debugging

1. `yarn cli:debug mock file.oas.yml`
2. Run your preferred debugger on the newly created process. If you're into VSCoode, you can create `.vscode/launch.json` and put this content inside:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "port": 9229
},
```

4. Enjoy the breakpoints :)
