import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { decimal, integer } from '@protofire/subgraph-toolkit'
import {
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  VaultHourlySnapshot,
} from '../../generated/schema'
import { protocol } from './protocol'
import { shared } from './shared'

export namespace timeSeries {
  export namespace vaults {
    export function loadOrCreateHourlySnapshot(id: string, vault: string): VaultHourlySnapshot {
      let entity = VaultHourlySnapshot.load(id)
      if (entity == null) {
        entity = new VaultHourlySnapshot(id)
        entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID)
        entity.vault = vault
        entity.totalValueLockedUSD = decimal.ZERO
        entity.inputTokenBalance = integer.ZERO
        entity.outputTokenSupply = integer.ZERO
        entity.outputTokenPriceUSD = decimal.ZERO
        entity.pricePerShare = decimal.ZERO
        entity.stakedOutputTokenAmount = integer.ZERO
        entity.rewardTokenEmissionsAmount = new Array<BigInt>()
        entity.rewardTokenEmissionsUSD = new Array<BigDecimal>()
        entity.blockNumber = integer.ZERO
        entity.timestamp = integer.ZERO
      }
      return entity as VaultHourlySnapshot
    }
  }

  export namespace financials {
    export function loadOrCreateDailySnapshot(timestamp: BigInt, blockNumber: BigInt): FinancialsDailySnapshot {
      let timestampNumber: number = timestamp.toI32()
      let id = Math.floor(timestampNumber / shared.constants.SECONDS_PER_DAY)

      let entity = FinancialsDailySnapshot.load(id.toString())
      if (entity == null) {
        entity = new FinancialsDailySnapshot(id.toString())
        entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID)
        entity.totalValueLockedUSD = decimal.ZERO
        entity.protocolControlledValueUSD = decimal.ZERO
        entity.dailySupplySideRevenueUSD = decimal.ZERO
        entity.cumulativeSupplySideRevenueUSD = decimal.ZERO
        entity.dailyProtocolSideRevenueUSD = decimal.ZERO
        entity.cumulativeProtocolSideRevenueUSD = decimal.ZERO
        entity.dailyTotalRevenueUSD = decimal.ZERO
        entity.cumulativeTotalRevenueUSD = decimal.ZERO
        entity.blockNumber = integer.ZERO
        entity.timestamp = integer.ZERO

        entity.blockNumber = blockNumber
        entity.timestamp = timestamp
      }
      return entity as FinancialsDailySnapshot
    }
  }
  export namespace usageMetrics {
    export function loadOrCreateHourlySnapshot(block: ethereum.Block): UsageMetricsHourlySnapshot {
      let id = Math.floor(block.timestamp.toI32() / shared.constants.SECONDS_PER_DAY)
        .toString()
        .concat('-')
        .concat(Math.floor(block.timestamp.toI32() / shared.constants.SECONDS_PER_HOUR).toString())
      let entity = UsageMetricsHourlySnapshot.load(id)
      if (entity == null) {
        entity = new UsageMetricsHourlySnapshot(id)
        entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID)
        entity.hourlyActiveUsers = 0
        entity.cumulativeUniqueUsers = 0
        entity.hourlyTransactionCount = 0
        entity.hourlyDepositCount = 0
        entity.hourlyWithdrawCount = 0

        entity.blockNumber = block.number
        entity.timestamp = block.timestamp
      }
      return entity as UsageMetricsHourlySnapshot
    }
    export function loadOrCreateDailySnapshot(block: ethereum.Block): UsageMetricsDailySnapshot {
      let id = Math.floor(block.timestamp.toI32() / shared.constants.SECONDS_PER_DAY)
      let entity = UsageMetricsDailySnapshot.load(id.toString())
      if (entity == null) {
        entity = new UsageMetricsDailySnapshot(id.toString())
        entity.protocol = protocol.getProtocolId(shared.constants.PROTOCOL_ID)
        entity.dailyActiveUsers = 0
        entity.cumulativeUniqueUsers = 0
        entity.dailyTransactionCount = 0
        entity.dailyDepositCount = 0
        entity.dailyWithdrawCount = 0

        entity.blockNumber = block.number
        entity.timestamp = block.timestamp
      }
      return entity as UsageMetricsDailySnapshot
    }
  }
}
