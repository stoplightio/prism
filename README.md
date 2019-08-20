# Prism API Server by [Stoplight](http://stoplight.io/?utm_source=github&utm_medium=prism)

[![Maintainability](https://api.codeclimate.com/v1/badges/64eb87e8bb92267e322e/maintainability)](https://codeclimate.com/github/stoplightio/prism/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/64eb87e8bb92267e322e/test_coverage)](https://codeclimate.com/github/stoplightio/prism/test_coverage)

### Current Prism Version: 2.0.21

The perfect OpenAPI Specification (formerly known as Swagger) companion. Turn any OpenAPI Specification document into an API server with dynamic mocking, transformations, validations, and more.

```shell
Usage:
  prism [command]

Available Commands:
  conduct     Run scenarios to orchestrate and test web APIs
  help        Help about any command
  login       Login to Stoplight
  logout      Logout of Stoplight
  mock        Create a mock server given an OASv2 specification
  serve       Start a prism server instance
  update      Update prism to latest or specific version
  validate    Run a contract server, validating upstream responses match a OASv2 specification
  version     Print prism version

Flags:
  -h, --help           help for prism
  -t, --token string   Stoplight token for user account

Use "prism [command] --help" for more information about a command.
```

Supports OpenAPI Specification 2. OpenAPI Specification 3 coming soon.

[More documentation](https://docs.stoplight.io/mocking/introduction?utm_source=github&utm_medium=prism)

## Installation

On OS X or Linux:

```
curl https://raw.githubusercontent.com/stoplightio/prism/2.x/install.sh | sh
```

With Docker

```
docker pull stoplight/prism:2
```

On Windows download [binary](https://github.com/stoplightio/prism/releases).

## Update

```
prism update
```
