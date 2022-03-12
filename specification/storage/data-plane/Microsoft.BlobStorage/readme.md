# BlobStorage

> see https://aka.ms/autorest

This is the AutoRest configuration file for BlobStorage.

---

## Getting Started

To build the SDK for BlobStorage, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the BlobStorage API.

```yaml
openapi-type: data-plane
tag: package-2021-02
use-internal-constructors: true
add-credentials: true
```

### Tag: package-2020-10

These settings apply only when `--tag=package-2020-10` is specified on the command line.

```yaml $(tag) == 'package-2020-10'
input-file:
  - preview/2020-10-02/blob.json
```

### Tag: package-2020-12

These settings apply only when `--tag=package-2020-12` is specified on the command line.

```yaml $(tag) == 'package-2020-12'
input-file:
  - preview/2020-12-06/blob.json
```

### Tag: package-2021-02

These settings apply only when `--tag=package-2021-02` is specified on the command line.

```yaml $(tag) == 'package-2021-02'
input-file:
  - preview/2021-02-12/blob.json
```

### Tag: package-2021-04

These settings apply only when `--tag=package-2021-04` is specified on the command line.

```yaml $(tag) == 'package-2021-04'
input-file:
  - preview/2021-04-10/blob.json
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
