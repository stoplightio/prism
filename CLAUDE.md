# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Prism is an open-source API mocking and contract testing platform supporting OpenAPI v2/v3.0/v3.1 and Postman Collections. It provides a mock server and validation proxy.

## Common Commands

```bash
# Install dependencies
npm ci

# Build (clean + compile TypeScript)
npm run build

# Run all tests
npm test

# Run tests for a specific package or file
npm test -- --testPathPattern="core"
npm test -- packages/http/src/__tests__/client.spec.ts

# Lint
npm run lint
npm run lint.fix

# Run CLI directly during development (from packages/cli)
cd packages/cli && npm run cli -- mock openapi.yaml

# Debug CLI (attaches Node inspector)
cd packages/cli && npm run cli:debug -- mock file.oas.yml

# Build binary
npm run build.binary

# Integration/harness tests (requires build.binary first)
npm run test.harness
```

## Architecture

This is a **Lerna monorepo** with npm workspaces. Packages have a strict layering:

```
packages/
├── core/         # Base abstractions: routing, validation, mocking contracts
├── http/         # HTTP-specific: mocker, validator, forwarder, router, negotiator
├── http-server/  # HTTP server using Micri; wires http/ into a running server
└── cli/          # CLI entry point using Yargs; commands: mock, proxy
```

**Data flow**: CLI → HTTP-Server → HTTP (mocker/validator/forwarder/router) → Core

### Key Design Patterns

- **fp-ts throughout**: The codebase uses `Either`, `TaskEither`, `Reader`, and `Option` from fp-ts for error handling and dependency injection. Expect functional-style pipelines via `pipe()`.
- **IPrismConfig / IHttpConfig**: Central config objects passed as dependencies control behavior (dynamic mocking, validation strictness, proxy mode).
- **Pino structured logging**: A logger instance is passed as a context through nearly all operations.
- **Mocker pipeline** (`packages/http/src/mocker/`): Negotiates content type → selects example or generates with `json-schema-faker` → applies callbacks.
- **Validator pipeline** (`packages/http/src/validator/`): AJV-based validation for request/response bodies, headers, path/query params.

### Important Files

| File                                   | Purpose                                        |
| -------------------------------------- | ---------------------------------------------- |
| `packages/core/src/factory.ts`         | Creates Prism instances                        |
| `packages/http/src/client.ts`          | HTTP client factory                            |
| `packages/http/src/mocker/index.ts`    | Mock response generation entrypoint            |
| `packages/http/src/validator/index.ts` | Validation entrypoint                          |
| `packages/http/src/router/index.ts`    | Matches requests to OpenAPI operations         |
| `packages/http/src/forwarder/index.ts` | Upstream proxy forwarding                      |
| `packages/cli/src/commands/`           | `mock` and `proxy` CLI command implementations |
| `packages/http-server/src/index.ts`    | HTTP server setup                              |

## Testing

- Tests live in `__tests__/` directories alongside source files, named `*.spec.ts` or `*.test.ts`
- Jest projects are scoped per package: `HTTP-SERVER`, `HTTP`, `CORE`, `CLI`
- `nock` is used for HTTP mocking in tests
- Harness tests (`packages/cli/src/__tests__/harness/`) test the compiled binary end-to-end

## Code Style

- Prettier: 120-char line width, single quotes, trailing commas (es5)
- ESLint with `@typescript-eslint` — `lint-staged` auto-fixes on commit via Husky
- Arrow functions: omit parens for single parameter
- TypeScript strict mode; `ttypescript` (ttsc) is used for compilation with custom transformers

## Branch & Release

- Feature branches: `feature/*`, `chore/*`, `fix/*`
- Releases managed via Lerna (`npm run release`)
- Node.js minimum: 18.20.1
