# C# Storage

> see https://aka.ms/autorest

This is the AutoRest configuration file for DNS.

## Common C# Settings

```yaml $(csharp)
csharp:
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  clear-output-folder: true
```

```yaml $(csharp) && !$(multiapi) && !$(csharp-profile)
payload-flattening-threshold: 2
namespace: Microsoft.Azure.Management.Storage
output-folder: $(csharp-sdks-folder)/storage/Microsoft.Azure.Management.Storage/src/Generated
```

## Batch settings

These settings are for batch mode only: (ie, add `--multiapi` to the command line )

```yaml $(multiapi)
namespace: Microsoft.Azure.Management.Storage.$(ApiVersionName)
output-folder: $(csharp-sdks-folder)/$(ApiVersionName)/Generated

batch:
  - tag: package-2016-01
    ApiVersionName: Api2016_01_01

  - tag: package-2015-06
    ApiVersionName: Api2015_06_05
```

### Profile: hybrid_2018_03_01

These settings apply only when `--csharp-profile=hybrid_2018_03_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2018_03_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: package-2018-03
  - tag: package-2018-02
  - tag: package-2017-10
  - tag: package-2016-01
```

### Profile: profile_2017_03_09

These settings apply only when `--csharp-profile=profile_2017_03_09` is specified on the command line.

```yaml $(csharp-profile)=='profile_2017_03_09'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: package-2016-01
```

### Profile: hybrid_2019_03_01

These settings apply only when `--csharp-profile=hybrid_2019_03_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2019_03_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: profile-hybrid-2019-03-01
```

### Profile: hybrid_2020_09_01

These settings apply only when `--csharp-profile=hybrid_2020_09_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2020_09_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: profile-hybrid-2020-09-01
```

### Profile: hybrid_2021_02_01

These settings apply only when `--csharp-profile=hybrid_2021_02_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2021_02_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: profile-hybrid-2021-02-01
```

### Profile: hybrid_2021_04_01

These settings apply only when `--csharp-profile=hybrid_2021_04_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2021_04_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: profile-hybrid-2021-04-01
```

### Profile: hybrid_2021_06_01

These settings apply only when `--csharp-profile=hybrid_2021_06_01` is specified on the command line.

```yaml $(csharp-profile)=='hybrid_2021_06_01'
namespace: Microsoft.Azure.Management.Profiles.$(csharp-profile).Storage
output-folder: $(csharp-sdks-folder)/$(csharp-profile)/storage/Microsoft.Azure.Management.Storage/src/Generated
batch:
  - tag: profile-hybrid-2021-06-01
```
