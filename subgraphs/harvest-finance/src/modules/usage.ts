import { Address, ethereum } from '@graphprotocol/graph-ts'

import { ActiveAccount, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from '../../generated/schema'
import { shared } from './shared'
import { accounts, protocol as protocols } from '../modules'

export function updateUsageMetrics(block: ethereum.Block, from: Address, callType: string = ''): void {
  const account = accounts.loadOrCreateAccount(from)

  const protocol = protocols.loadOrCreateYieldAggregator()
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block)
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block)

  usageMetricsDaily.blockNumber = block.number
  usageMetricsHourly.blockNumber = block.number

  usageMetricsDaily.timestamp = block.timestamp
  usageMetricsHourly.timestamp = block.timestamp

  usageMetricsDaily.dailyTransactionCount += 1
  usageMetricsHourly.hourlyTransactionCount += 1

  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers

  let dailyActiveAccountId = (block.timestamp.toI64() / shared.constants.SECONDS_PER_DAY)
    .toString()
    .concat('-')
    .concat(from.toHexString())

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId)

  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId)
    dailyActiveAccount.save()

    usageMetricsDaily.dailyActiveUsers += 1
    usageMetricsHourly.hourlyActiveUsers += 1
  }

  if (callType === shared.constants.CallType.DEPOSIT) {
    usageMetricsDaily.dailyDepositCount += 1
    usageMetricsHourly.hourlyDepositCount += 1
  } else if (callType === shared.constants.CallType.WITHDRAW) {
    usageMetricsDaily.dailyWithdrawCount += 1
    usageMetricsHourly.hourlyWithdrawCount += 1
  }

  usageMetricsDaily.save()
  usageMetricsHourly.save()
  account.save()
}

export function getOrCreateUsageMetricsDailySnapshot(block: ethereum.Block): UsageMetricsDailySnapshot {
  let id: i64 = block.timestamp.toI64() / shared.constants.SECONDS_PER_DAY
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString())

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString())
    usageMetrics.protocol = shared.constants.PROTOCOL_ID.toHexString()

    usageMetrics.dailyActiveUsers = 0
    usageMetrics.cumulativeUniqueUsers = 0
    usageMetrics.dailyTransactionCount = 0
    usageMetrics.dailyDepositCount = 0
    usageMetrics.dailyWithdrawCount = 0

    usageMetrics.blockNumber = block.number
    usageMetrics.timestamp = block.timestamp

    usageMetrics.save()
  }

  return usageMetrics
}

export function getOrCreateUsageMetricsHourlySnapshot(block: ethereum.Block): UsageMetricsHourlySnapshot {
  let metricsID: string = (block.timestamp.toI64() / shared.constants.SECONDS_PER_DAY)
    .toString()
    .concat('-')
    .concat((block.timestamp.toI64() / shared.constants.SECONDS_PER_HOUR).toString())
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID)

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID)
    usageMetrics.protocol = shared.constants.PROTOCOL_ID.toHexString()

    usageMetrics.hourlyActiveUsers = 0
    usageMetrics.cumulativeUniqueUsers = 0
    usageMetrics.hourlyTransactionCount = 0
    usageMetrics.hourlyDepositCount = 0
    usageMetrics.hourlyWithdrawCount = 0

    usageMetrics.blockNumber = block.number
    usageMetrics.timestamp = block.timestamp

    usageMetrics.save()
  }

  return usageMetrics
}
