## Java

These settings apply only when `--java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-libraries-for-java clone>`.

```yaml $(java)
azure-arm: true
fluent: true
namespace: com.microsoft.azure.management.storage
license-header: MICROSOFT_MIT_NO_CODEGEN
payload-flattening-threshold: 2
output-folder: $(azure-libraries-for-java-folder)/azure-mgmt-storage
```

### Java multi-api

```yaml $(java) && $(multiapi)
batch:
  - tag: package-2021-06
  - tag: package-2021-04
  - tag: package-2021-02
  - tag: package-2020-08-preview
  - tag: package-2019-06
  - tag: package-2019-04
  - tag: package-2018-07
  - tag: package-2018-03
  - tag: package-2018-02
  - tag: package-2017-10
  - tag: package-2016-01
```

### Tag: package-2021-06 and java

These settings apply only when `--tag=package-2021-06 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2021-06' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2021_06_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2021_06_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2021-04 and java

These settings apply only when `--tag=package-2021-04 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2021-04' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2021_04_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2021_04_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2021-02 and java

These settings apply only when `--tag=package-2021-02 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2021-02' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2021_02_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2021_02_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2020-08-preview and java

These settings apply only when `--tag=package-2020-08-preview --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2020-08-preview' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2019_08_01_preview
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2019_08_01_preview
regenerate-manager: true
generate-interface: true
```

### Tag: package-2019-06 and java

These settings apply only when `--tag=package-2019-06 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2019-06' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2019_06_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2019_06_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2019-04 and java

These settings apply only when `--tag=package-2019-04 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2019-04' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2019_04_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2019_04_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2018-07 and java

These settings apply only when `--tag=package-2018-07 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2018-07' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2018_07_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2018_07_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2018-03 and java

These settings apply only when `--tag=package-2018-03 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2018-03' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2018_03_01_preview
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2018_03_01_preview
regenerate-manager: true
generate-interface: true
```

### Tag: package-2018-02 and java

These settings apply only when `--tag=package-2018-02 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2018-02' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2018_02_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2018_02_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2017-10 and java

These settings apply only when `--tag=package-2017-10 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2017-10' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2017_10_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2017_10_01
regenerate-manager: true
generate-interface: true
```

### Tag: package-2016-01 and java

These settings apply only when `--tag=package-2016-01 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'package-2016-01' && $(java) && $(multiapi)
java:
  namespace: com.microsoft.azure.management.storage.v2016_01_01
  output-folder: $(azure-libraries-for-java-folder)/sdk/storage/mgmt-v2016_01_01
regenerate-manager: true
generate-interface: true
```

### Tag: profile-hybrid-2019-03-01

These settings apply only when `--tag=profile-hybrid-2019-03-01` is specified on the command line.
Creating this tag to pick proper resources from the hybrid profile.

```yaml $(tag) == 'profile-hybrid-2019-03-01'
input-file:
  - Microsoft.Storage/stable/2017-10-01/storage.json
```

### Tag: profile-hybrid-2020-09-01 and java

These settings apply only when `--tag=profile-hybrid-2020-09-01 --java` is specified on the command line.
Please also specify `--azure-libraries-for-java-folder=<path to the root directory of your azure-sdk-for-java clone>`.

```yaml $(tag) == 'profile-hybrid-2020-09-01' && $(java)
input-file:
  - Microsoft.Storage/stable/2019-06-01/storage.json
  - Microsoft.Storage/stable/2019-06-01/blob.json
  - Microsoft.Storage/stable/2019-06-01/file.json
  - Microsoft.Storage/stable/2019-06-01/queue.json
  - Microsoft.Storage/stable/2019-06-01/table.json

directive:
  - from: storage.json
    where: $.definitions.Identity.properties.type
    transform: >
      $['x-ms-enum'].modelAsString = true;

  - suppress: R3018
    reason: Existing boolean properties
    approved-by: '@fearthecowboy'

  - where:
      - $.paths["/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/blobServices/default/containers/{containerName}/setLegalHold"].post.operationId
      - $.paths["/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/blobServices/default/containers/{containerName}/clearLegalHold"].post.operationId
      - $.paths["/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Storage/storageAccounts/{accountName}/regenerateKey"].post.operationId
    suppress: R1003
    reason: APIs return array of values, is not actually a 'list' operation
    approved-by: '@fearthecowboy'
```
