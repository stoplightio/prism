prism-cli
=========

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/prism-cli.svg)](https://npmjs.org/package/@stoplight/prism-cli)
[![Downloads/week](https://img.shields.io/npm/dw/prism-cli.svg)](https://npmjs.org/package/@stoplight/prism-cli)
[![License](https://img.shields.io/npm/l/prism-cli.svg)](https://github.com/stoplightio/prism/blob/master/package.json)

<!-- toc -->
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
@stoplight/prism-cli/3.0.0-pre.1 darwin-x64 node-v8.11.2
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
* [`prism server SPEC`](#prism-server-spec)

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
  SPEC  Path to a spec file

OPTIONS
  -p, --port=port  (required) [default: 4010] Port that Prism will run on.
```

_See code: [src/commands/mock.ts](https://github.com/stoplightio/prism/blob/v3.0.0-pre.1/src/commands/mock.ts)_

## `prism server SPEC`

Start a server with the given spec file

```
USAGE
  $ prism server SPEC

ARGUMENTS
  SPEC  Path to a spec file

OPTIONS
  -p, --port=port  (required) [default: 4010] Port that Prism will run on.
```

_See code: [src/commands/server.ts](https://github.com/stoplightio/prism/blob/v3.0.0-pre.1/src/commands/server.ts)_
<!-- commandsstop -->

## Development

### Debugging

1. `node --inspect -r tsconfig-paths/register bin/run`
2. .vscode/launch.json

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "port": 9229
},
```

3. Run VSCode debugger
4. Enjoy breakpoints in VSCode :)
