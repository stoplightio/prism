# @stoplight/graphite
[![Maintainability](https://api.codeclimate.com/v1/badges/ac453dbde4e365fe9cce/maintainability)](https://codeclimate.com/repos/5bd8e4484426590257001c75) [![Test Coverage](https://api.codeclimate.com/v1/badges/ac453dbde4e365fe9cce/test_coverage)](https://codeclimate.com/repos/5bd8e4484426590257001c75)

<!-- BADGES -->

Nodes'n things.

- Explore the components: [Storybook](https://stoplightio.github.io/graphite)
- View the changelog: [Releases](https://github.com/stoplightio/graphite/releases)

## Installation

Supported in modern browsers and node.

```bash
# latest stable
yarn add @stoplight/graphite
```

## Usage

Note, this is not all implemented, but rather an example of what it might look like.

```ts
import {
  Graphite,
  FilesystemPlugin,
  JsonPlugin,
  YamlPlugin,
  Oas2Plugin
} from "@stoplight/graphite";

const graphite = Graphite();

graphite.registerPlugins(
  FilesystemSource(),
  JsonPlugin(),
  YamlPlugin(),
  Oas2Plugin()
);

// Mirror two Graphite instances. The mirroredGraphite instance has no plugins, and simply applies the results of the graphite instance.
const mirroredGraphite = Graphite();
graphite.on("did_patch", mirroredGraphite.applyPatch);

// Add a single SourceNode of type file
const n = graphite.addSourceNode({
  type: FilesystemPlugin.File,
  path: "/foo.json"
});

// Queue up a read task for that node
n.read();

// Wait until all processing is done
await graphite.tasksProcessed();

// The two graphs should be identical, ids and all.
// Note, the mirroredGraph did NO work - all the file reading, parsing, etc, was done by the plugins in the main graphite instance.
expect(graphite.dehydrate()).toEqual(mirroredGraphite.dehydrate());
```

## Concepts

### Graph

- Holds nodes and edges.
- Exposes methods to `add` and `remove` nodes/edges.
- Responsible for managing node/edge lifecycle.

#### Nodes

- They hold data.
- There are three node categories (described below): `source`, `source_map`, and `virtual`.

#### Edges

- They represent relationships between nodes.

### Graphite

- Manages a single graph instance.
- Exposes `applyPatch` method.
- Emits events as patches are processed.
- Exposes convenience methods for common patterns, such as `addSourceNode`, that simply build and a patch or task and call `applyPatch` or `queueTask`.
- Manages tasks.

### Mutations

- ALL changes, both internal and external, pass through the `graphite.applyPatch` method.

#### JsonPatch

- A group of `JsonOperations`.

#### GraphPatch

- A group of `JsonOperations`, and their inverse. This is similar to the concept of a "transaction".
- If one operation fails, they all fail, and a rollback is attempted.

#### GraphTask

- Describes a single change to be made to the graph.
- Any operations that cannot be accomplished via `JsonPatch` must be queued up via a `GraphTask`.
- Examples include `add_node`, `read_node`, `write_node`, `parse_node`, `compute_node_source_map`.
- Plugins can define their own tasks, such as `oas2_lint_node`.
- The result of a `GraphTask` must always be a `GraphPatch`.
- When a task is run, the `GraphPatch` it returns is applied to the graph.

#### Scheduler

- Manages one or more task queues.
- We will at the very least have `high` and `low` priority queues.
- Tasks such as `add_node` and `read_node` will go into a `high` priority queue.
- Tasks such as `oas2_lint_node` and `resolve_node` will go into a `low` priority queue.

#### Notifier

- Manages events like a boss.

### Sources

#### SourceNode

- Source nodes are the only node category
- Exposes 4 primary properties - `original`, `raw`, `parsed` (TODO), and `isDirty`.
- Exposes 4 primary methods - `read`, `write`, `updateRaw`, and `updateParsed`.

#### SourceSink

- Responsible for reading data from some data source, and adding the appropriate source nodes.
- Responsible for refreshing the `original` property of a `SourceNode` in response to `read_node` tasks.
- Responsible for writing the `SourceNode` raw property back to the data source in response to `write_node` tasks.
- Implements `ISourceReader` and/or `ISourceWriter`.

#### SourceParser

- Targets one or more `SourceNodes`.
- Responsible for computing its `parsed` value when `raw` changes.
- Responsible for computing its `raw` value when `parsed` changes.

#### SourceMapNode

- A specific type of node that is a child of a `SourceNode`.
- Its `uri` points to a real location in the original source.
- Its data property points to a value in its parent `SourceNode.parsed`, according to its `uri`.
- Exposes an `update` method that queues a `GraphPatch` to update its source node parsed value.

#### SourceTree

- Defines a `ISourceTreeMap` that describes how a `SourceNode.parsed` value should be translated into `SourceMapNodes`.

### VirtualNode

- Anything that is not a `SourceNode` or `SourceTreeNode`
- Examples: linting results, transformed http operation and http service nodes, etc

## Contributing

1. Clone repo.
2. Create / checkout `feature/{name}`, `chore/{name}`, or `fix/{name}` branch.
3. Install deps: `yarn`.
4. Make your changes.
5. Run tests: `yarn test.prod`.
6. Stage relevant files to git.
7. Commit: `yarn commit`. _NOTE: Commits that don't follow the [conventional](https://github.com/marionebl/commitlint/tree/master/%40commitlint/config-conventional) format will be rejected. `yarn commit` creates this format for you, or you can put it together manually and then do a regular `git commit`._
8. Push: `git push`.
9. Open PR targeting the `next` branch.
