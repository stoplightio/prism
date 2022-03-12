## CLI

These settings don't need to apply `--cli` on the command line.

```yaml
cli:
  cli-name: storage
  package-name: azure-mgmt-storage
  namespace: azure.mgmt.storage
  test-scenario:
    - name: StorageAccountCreate
    - name: PutFileServices
    - name: PutBlobServices
    - name: StorageAccountPutEncryptionScope
    - name: StorageAccountSetManagementPolicies
    - name: PutShares
    - name: StorageAccountPutPrivateEndpointConnection
    - name: PutContainers
    - name: CreateOrUpdateImmutabilityPolicy
    - name: GetImmutabilityPolicy
    - name: GetContainers
    - name: StorageAccountGetPrivateEndpointConnection
    - name: GetShares
    - name: StorageAccountGetManagementPolicies
    - name: ListContainers
    - name: StorageAccountGetEncryptionScope
    - name: ListShares
    - name: GetBlobServices
    - name: GetFileServices
    - name: StorageAccountListPrivateLinkResources
    - name: StorageAccountEncryptionScopeList
    - name: ListBlobServices
    - name: ListFileServices
    - name: StorageAccountGetProperties
    - name: StorageAccountListByResourceGroup
    - name: UsageList
    - name: StorageAccountList
    - name: SkuList
    - name: OperationsList
    - name: ExtendImmutabilityPolicy
    - name: LockImmutabilityPolicy
    - name: ClearLegalHoldContainers
    - name: SetLegalHoldContainers
    - name: Break a lease on a container
    - name: Acquire a lease on a container
    - name: UpdateContainers
    - name: UpdateShares
    - name: StorageAccountPatchEncryptionScope
    - name: StorageAccountRevokeUserDelegationKeys
    - name: BlobRangesRestore
    - name: StorageAccountListServiceSAS
    - name: StorageAccountListAccountSAS
    - name: StorageAccountRegenerateKey
    - name: StorageAccountRegenerateKerbKey
    - name: StorageAccountListKeys
    - name: StorageAccountFailover
    - name: StorageAccountEnableAD
    - name: StorageAccountUpdate
    - name: StorageAccountCheckNameAvailability
    - name: DeleteImmutabilityPolicy
    - name: DeleteContainers
    - name: StorageAccountDeletePrivateEndpointConnection
    - name: DeleteShares
    - name: StorageAccountDeleteManagementPolicies
    - name: StorageAccountDelete
```
