import { Address, ethereum } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO, decimal, integer } from '@protofire/subgraph-toolkit'
import { VaultContract } from '../../generated/ControllerListener/VaultContract'
import { Vault, VaultDailySnapshot, VaultHourlySnapshot } from '../../generated/schema'
import { protocol } from './protocol'
import { shared } from './shared'

export namespace vaults {
  export function loadOrCreateVault(vaultAddress: Address): Vault {
    let id = vaultAddress.toHexString()
    let entity = Vault.load(id)
    if (entity == null) {
      entity = new Vault(id)
      entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID)
      entity.inputToken = ''
      entity.outputToken = ''
      entity.rewardTokens = []
      entity.totalValueLockedUSD = decimal.ZERO
      entity.inputTokenBalance = integer.ZERO
      entity.outputTokenSupply = integer.ZERO
      entity.outputTokenPriceUSD = decimal.ZERO
      entity.pricePerShare = decimal.ZERO
      entity.rewardTokenEmissionsAmount = []
      entity.rewardTokenEmissionsUSD = []
      entity.createdTimestamp = integer.ZERO
      entity.createdBlockNumber = integer.ZERO
      entity.name = ''
      entity.symbol = ''
      entity.depositLimit = integer.ZERO
      entity.fees = []
    }
    return entity as Vault
  }

  export function addFee(entity: Vault, feeId: string): Vault {
    let e = entity
    let _vaultFees = e.fees
    _vaultFees.push(feeId)
    e.fees = _vaultFees
    return e
  }

  export function getValuesForVault(vaultAddress: Address): VaultValuesResult {
    let contract = VaultContract.bind(vaultAddress)
    let underlyingResult = contract.try_underlying()
    let underlying = !underlyingResult.reverted ? underlyingResult.value : (Address.fromString(ADDRESS_ZERO) as Address)

    let controllerAddressResult = contract.try_controller()
    let controllerAddress = !controllerAddressResult.reverted
      ? controllerAddressResult.value
      : (Address.fromString(ADDRESS_ZERO) as Address)

    return new VaultValuesResult(
      shared.readValue<string>(contract.try_symbol(), `fallBackValueFor ${vaultAddress.toHexString()}`),
      shared.readValue<string>(contract.try_name(), `fallBackValueFor ${vaultAddress.toHexString()}`),
      underlying,
      controllerAddress,
    )
  }

  export class VaultValuesResult {
    symbol: string
    name: string
    underLyingToken: Address
    controllerAddress: Address
    constructor(_symbol: string, _name: string, _underLyingToken: Address, _controllerAddress: Address) {
      this.symbol = _symbol
      this.name = _name
      this.underLyingToken = _underLyingToken
      this.controllerAddress = _controllerAddress
    }
  }

  export function updateVaultSnapshots(vaultAddress: Address, block: ethereum.Block): void {
    let vault = loadOrCreateVault(vaultAddress)

    const vaultDailySnapshots = loadOrCreateVaultsDailySnapshots(vaultAddress, block)
    const vaultHourlySnapshots = loadOrCreateVaultsHourlySnapshots(vaultAddress, block)

    vaultDailySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD
    vaultHourlySnapshots.totalValueLockedUSD = vault.totalValueLockedUSD

    vaultDailySnapshots.inputTokenBalance = vault.inputTokenBalance
    vaultHourlySnapshots.inputTokenBalance = vault.inputTokenBalance

    vaultDailySnapshots.outputTokenSupply = vault.outputTokenSupply!
    vaultHourlySnapshots.outputTokenSupply = vault.outputTokenSupply!

    vaultDailySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD
    vaultHourlySnapshots.outputTokenPriceUSD = vault.outputTokenPriceUSD

    vaultDailySnapshots.pricePerShare = vault.pricePerShare
    vaultHourlySnapshots.pricePerShare = vault.pricePerShare

    vaultDailySnapshots.blockNumber = block.number
    vaultHourlySnapshots.blockNumber = block.number

    vaultDailySnapshots.timestamp = block.timestamp
    vaultHourlySnapshots.timestamp = block.timestamp

    vaultDailySnapshots.save()
    vaultHourlySnapshots.save()
  }

  export function loadOrCreateVaultsHourlySnapshots(vaultAddress: Address, block: ethereum.Block): VaultHourlySnapshot {
    let id: string = vaultAddress
      .toHexString()
      .concat((block.timestamp.toI64() / shared.constants.SECONDS_PER_DAY).toString())
      .concat('-')
      .concat((block.timestamp.toI64() / shared.constants.SECONDS_PER_HOUR).toString())
    let vaultSnapshots = VaultHourlySnapshot.load(id)

    if (!vaultSnapshots) {
      vaultSnapshots = new VaultHourlySnapshot(id)
      vaultSnapshots.protocol = shared.constants.PROTOCOL_ID.toHexString()
      vaultSnapshots.vault = vaultAddress.toHexString()

      vaultSnapshots.totalValueLockedUSD = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.inputTokenBalance = shared.constants.BIGINT_ZERO
      vaultSnapshots.outputTokenSupply = shared.constants.BIGINT_ZERO
      vaultSnapshots.outputTokenPriceUSD = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.pricePerShare = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.stakedOutputTokenAmount = shared.constants.BIGINT_ZERO
      vaultSnapshots.rewardTokenEmissionsAmount = [shared.constants.BIGINT_ZERO]
      vaultSnapshots.rewardTokenEmissionsUSD = [shared.constants.BIGDECIMAL_ZERO]

      vaultSnapshots.blockNumber = block.number
      vaultSnapshots.timestamp = block.timestamp
    }

    return vaultSnapshots
  }

  export function loadOrCreateVaultsDailySnapshots(vaultAddress: Address, block: ethereum.Block): VaultDailySnapshot {
    let id: string = vaultAddress
      .toHexString()
      .concat((block.timestamp.toI64() / shared.constants.SECONDS_PER_DAY).toString())
    let vaultSnapshots = VaultDailySnapshot.load(id)

    if (!vaultSnapshots) {
      vaultSnapshots = new VaultDailySnapshot(id)
      vaultSnapshots.protocol = shared.constants.PROTOCOL_ID.toHexString()
      vaultSnapshots.vault = vaultAddress.toHexString()

      vaultSnapshots.totalValueLockedUSD = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.inputTokenBalance = shared.constants.BIGINT_ZERO
      vaultSnapshots.outputTokenSupply = shared.constants.BIGINT_ZERO
      vaultSnapshots.outputTokenPriceUSD = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.pricePerShare = shared.constants.BIGDECIMAL_ZERO
      vaultSnapshots.stakedOutputTokenAmount = shared.constants.BIGINT_ZERO
      vaultSnapshots.rewardTokenEmissionsAmount = [shared.constants.BIGINT_ZERO]
      vaultSnapshots.rewardTokenEmissionsUSD = [shared.constants.BIGDECIMAL_ZERO]

      vaultSnapshots.blockNumber = block.number
      vaultSnapshots.timestamp = block.timestamp
    }

    return vaultSnapshots
  }
}
