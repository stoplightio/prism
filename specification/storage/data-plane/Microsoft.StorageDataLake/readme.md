# StorageDataLake

> see https://aka.ms/autorest

This is the AutoRest configuration file for StorageDataLake.

---

## Getting Started

To build the SDK for StorageDataLake, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the StorageDataLake API.

```yaml
openapi-type: data-plane
tag: package-2020-06
use-internal-constructors: true
add-credentials: true
```

### Tag: package-2018-11

These settings apply only when `--tag=package-2018-11` is specified on the command line.

```yaml $(tag) == 'package-2018-11'
input-file:
  - stable/2018-11-09/DataLakeStorage.json
```

### Tag: package-2018-06-preview

These settings apply only when `--tag=package-2018-06-preview` is specified on the command line.

```yaml $(tag) == 'package-2018-06-preview'
input-file:
  - preview/2018-06-17/DataLakeStorage.json
```

### Tag: package-2019-10

These settings apply only when `--tag=package-2019-10` is specified on the command line.

```yaml $(tag) == 'package-2019-10'
input-file:
  - stable/2019-10-31/DataLakeStorage.json
```

### Tag: package-2020-06

These settings apply only when `--tag=package-2020-06` is specified on the command line.

```yaml $(tag) == 'package-2020-06'
input-file:
  - preview/2020-06-12/DataLakeStorage.json
```

### Tag: package-2020-10

These settings apply only when `--tag=package-2020-10` is specified on the command line.

```yaml $(tag) == 'package-2020-10'
input-file:
  - preview/2020-10-02/DataLakeStorage.json
```

### Suppression

```yaml
directive:
  - suppress: DefinitionsPropertiesNamesCamelCase
    reason: These parameters are predfined by storage specifications
  - suppress: XmsPathsMustOverloadPaths
  - suppress: XmsExamplesRequired
  - suppress: OperationIdNounConflictingModelNames
    reason: This is only a warning. Changing these definitions would be a massive breaking change to our clients
  - suppress: LongRunningOperationsWithLongRunningExtension
  - suppress: OAV107
```

---
