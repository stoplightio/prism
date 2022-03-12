## Ruby

These settings apply only when `--ruby` is specified on the command line.

```yaml
package-name: azure_mgmt_storage
package-version: '0.16.3'
azure-arm: true
```

### Ruby multi-api

```yaml $(ruby) && $(multiapi)
batch:
  - tag: package-2021-06
  - tag: package-2021-04
  - tag: package-2020-08-preview
  - tag: package-2018-02
  - tag: package-2017-10
  - tag: package-2017-06
  - tag: package-2016-12
  - tag: package-2016-01
  - tag: package-2015-06
  - tag: package-2015-05-preview
```

### Tag: package-2021-06 and ruby

These settings apply only when `--tag=package-2021-06 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2021-06' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2021-06'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2021-04 and ruby

These settings apply only when `--tag=package-2021-04 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2021-04' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2021-04'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2020-08-preview and ruby

These settings apply only when `--tag=package-2020-08-preview --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2020-08-preview' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2020_08_01_preview'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2018-02 and ruby

These settings apply only when `--tag=package-2018-02 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2018-02' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2018_02_01'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2017-10 and ruby

These settings apply only when `--tag=package-2017-10 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2017-10' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2017_10_01'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2017-06 and ruby

These settings apply only when `--tag=package-2017-06 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2017-06' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2017_06_01'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2016-12 and ruby

These settings apply only when `--tag=package-2016-12 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2016-12' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2016_12_01'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2016-01 and ruby

These settings apply only when `--tag=package-2016-01 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2016-01' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2016_01_01'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2015-06 and ruby

These settings apply only when `--tag=package-2015-06 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2015-06' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2015_06_15'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```

### Tag: package-2015-05-preview and ruby

These settings apply only when `--tag=package-2015-05-preview --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2015-05-preview' && $(ruby)
namespace: 'Azure::Storage::Mgmt::V2015_05_01_preview'
output-folder: $(ruby-sdks-folder)/management/azure_mgmt_storage/lib
```
