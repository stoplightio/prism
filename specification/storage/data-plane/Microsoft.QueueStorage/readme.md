# QueueStorage

> see https://aka.ms/autorest

This is the AutoRest configuration file for QueueStorage.

---

## Getting Started

To build the SDK for QueueStorage, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the QueueStorage API.

```yaml
openapi-type: data-plane
tag: package-2018-03
use-internal-constructors: true
add-credentials: true
```

### Tag: package-2018-03

These settings apply only when `--tag=package-2018-03` is specified on the command line.

```yaml $(tag) == 'package-2018-03'
input-file:
  - preview/2018-03-28/queue.json
```

### Suppression

```yaml
directive:
  - suppress: DefinitionsPropertiesNamesCamelCase
    reason: These parameters are predfined by storage specifications
  - suppress: XmsPathsMustOverloadPaths
  - suppress: XmsExamplesRequired
  - suppress: LongRunningOperationsWithLongRunningExtension
  - suppress: OAV107
```

---
