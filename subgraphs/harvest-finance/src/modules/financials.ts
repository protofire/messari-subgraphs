import { BigInt } from '@graphprotocol/graph-ts'
import { FinancialsDailySnapshot } from '../../generated/schema'
import { shared } from './shared'

import { protocol as protocols } from '../modules'

export function getOrCreateFinancialMetrics(timestamp: BigInt, blockNumber: BigInt): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id = timestamp.toI64() / shared.constants.SECONDS_PER_DAY
  let financialMetrics = FinancialsDailySnapshot.load(id.toString())

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString())
    financialMetrics.protocol = shared.constants.PROTOCOL_ID.toHexString()

    financialMetrics.totalValueLockedUSD = shared.constants.BIGDECIMAL_ZERO

    financialMetrics.protocolControlledValueUSD = shared.constants.BIGDECIMAL_ZERO
    financialMetrics.dailySupplySideRevenueUSD = shared.constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeSupplySideRevenueUSD = shared.constants.BIGDECIMAL_ZERO
    financialMetrics.dailyProtocolSideRevenueUSD = shared.constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeProtocolSideRevenueUSD = shared.constants.BIGDECIMAL_ZERO

    financialMetrics.dailyTotalRevenueUSD = shared.constants.BIGDECIMAL_ZERO
    financialMetrics.cumulativeTotalRevenueUSD = shared.constants.BIGDECIMAL_ZERO

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
