import { Address, BigInt } from '@graphprotocol/graph-ts'
import { FinancialsDailySnapshot, YieldAggregator } from '../../generated/schema'
import { constants } from './shared'

import { vaults, protocol as protocols } from '../modules'

export function getOrCreateFinancialMetrics(timestamp: BigInt, blockNumber: BigInt): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id = timestamp.toI64() / constants.SECONDS_PER_DAY
  let financialMetrics = FinancialsDailySnapshot.load(id.toString())

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString())
    financialMetrics.protocol = constants.PROTOCOL_ID

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO

    financialMetrics.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO

    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO

    financialMetrics.blockNumber = blockNumber
    financialMetrics.timestamp = timestamp

    financialMetrics.save()
  }
  return financialMetrics
}

export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  let financialMetrics = getOrCreateFinancialMetrics(timestamp, blockNumber)
  const protocol = protocols.loadOrCreateYieldAggregator()

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD

  financialMetrics.blockNumber = blockNumber
  financialMetrics.timestamp = timestamp

  financialMetrics.save()
}
