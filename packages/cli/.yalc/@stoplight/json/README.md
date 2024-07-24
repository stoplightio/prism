# @stoplight/json

[![Maintainability](https://api.codeclimate.com/v1/badges/85d2215f8b1e8a15214f/maintainability)](https://codeclimate.com/github/stoplightio/json/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/85d2215f8b1e8a15214f/test_coverage)](https://codeclimate.com/github/stoplightio/json/test_coverage)

Useful functions when working with JSON.

- View the changelog: [Releases](https://github.com/stoplightio/json/releases)

### Installation

Supported in modern browsers and node.

```bash
# latest stable version
yarn add @stoplight/json
```

### Usage

- **[parseWithPointers](https://stoplightio.github.io/json/globals.html#parsewithpointers)**: Like `JSON.parse(val)` but also returns parsing errors as well as full ast with line information.
- **[pathToPointer](https://stoplightio.github.io/json/globals.html#pathtopointer)**: Turns an array of path segments into a json pointer IE `['paths', '/user', 'get']` -> `#/paths/~1user/get`.
- **[pointerToPath](https://stoplightio.github.io/json/globals.html#pointertopath)**: Turns a json pointer into an array of path segments IE `#/paths/~1user/get` -> `['paths', '/user', 'get']`.
- **[safeParse](https://stoplightio.github.io/json/globals.html#safeparse)**: Like `JSON.parse(val)` but does not throw on invalid JSON.
- **[safeStringify](https://stoplightio.github.io/json/globals.html#safestringify)**: Like `JSON.stringify(val)` but handles circular references.
- **[startsWith](https://stoplightio.github.io/json/globals.html#startswith)**: Like native JS `x.startsWith(y)` but works with strings AND arrays.
- **[trimStart](https://stoplightio.github.io/json/globals.html#trimstart)**: Like `lodash.startsWith(x, y)` but works with strings AND arrays.
- **[getJsonPathForPosition](https://stoplightio.github.io/json/globals.html#getjsonpathforposition)**: Computes JSON path for given position.
- **[getLocationForJsonPath](https://stoplightio.github.io/json/globals.html#getlocationforjsonpath)**: Retrieves location of node matching given JSON path.

#### Example `parseWithPointers`

```ts
import { parseWithPointers } from "@stoplight/json";

const result = parseWithPointers('{"foo": "bar"}');

console.log(result.data); // => the {foo: "bar"} JS object
console.log(result.pointers); // => the source map with a single "#/foo" pointer that has position info for the foo property
```

```ts
// basic example of getJsonPathForPosition and getLocationForJsonPath
import { getJsonPathForPosition, getLocationForJsonPath, parseWithPointers } from "@stoplight/json";

const result = parseWithPointers(`{
  "hello": "world",
  "address": {
    "street": 123
  }
}`);

const path = getJsonPathForPosition(result, { line: 3, character: 15 }); // line and character are 0-based
console.log(path); // -> ["address", "street"];

const position = getLocationForJsonPath(result, ["address"]);
console.log(position.range.start); // { line: 2, character: 13 } line and character are 0-based
console.log(position.range.end); // { line: 4, character: 3 } line and character are 0-based
```

### Contributing

1. Clone repo.
2. Create / checkout `feature/{name}`, `chore/{name}`, or `fix/{name}` branch.
3. Install deps: `yarn`.
4. Make your changes.
5. Run tests: `yarn test.prod`.
6. Stage relevant files to git.
7. Commit: `yarn commit`. _NOTE: Commits that don't follow the [conventional](https://github.com/marionebl/commitlint/tree/master/%40commitlint/config-conventional) format will be rejected. `yarn commit` creates this format for you, or you can put it together manually and then do a regular `git commit`._
8. Push: `git push`.
9. Open PR targeting the `next` branch.
