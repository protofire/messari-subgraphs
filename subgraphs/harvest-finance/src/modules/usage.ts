import { Address, ethereum } from '@graphprotocol/graph-ts'

import { ActiveAccount, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot } from '../../generated/schema'
import { shared } from './shared'
import { accounts, protocol as protocols } from '../modules'

//  Update usage related fields and entities
export function updateUsageMetrics(block: ethereum.Block, from: Address, callType: string = ''): void {
  const isNewAccount = accounts.isNewAccount(from)
  const account = accounts.loadOrCreateAccount(from)

  const protocol = protocols.loadOrCreateYieldAggregator()
  const usageMetricsDaily = getOrCreateUsageMetricsDailySnapshot(block)
  const usageMetricsHourly = getOrCreateUsageMetricsHourlySnapshot(block)

  let cumulativeUniqueUsers = protocol.cumulativeUniqueUsers
  if (isNewAccount) cumulativeUniqueUsers += 1

  protocol.cumulativeUniqueUsers = cumulativeUniqueUsers

  usageMetricsDaily.blockNumber = block.number
  usageMetricsHourly.blockNumber = block.number

  usageMetricsDaily.timestamp = block.timestamp
  usageMetricsHourly.timestamp = block.timestamp

  usageMetricsDaily.dailyTransactionCount += 1
  usageMetricsHourly.hourlyTransactionCount += 1

  usageMetricsDaily.cumulativeUniqueUsers = cumulativeUniqueUsers
  usageMetricsHourly.cumulativeUniqueUsers = cumulativeUniqueUsers

  // Add active accounts
  let isNewDailyAccount = createDailyActiveAccount(from, block.timestamp.toI32())
  let isNewHourlyAccount = createHourlyActiveAccount(from, block.timestamp.toI32())

  if (isNewDailyAccount) {
    usageMetricsDaily.dailyActiveUsers += 1
  }

  if (isNewHourlyAccount) {
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

export function createDailyActiveAccount(accountAddress: Address, timestamp: i32): boolean {
  const dailyAccountId = 'daily'
    .concat('-')
    .concat(accountAddress.toHex())
    .concat('-')
    .concat(getDaysSinceEpoch(timestamp))

  return _createActiveAccount(dailyAccountId)
}

export function createHourlyActiveAccount(accountAddress: Address, timestamp: i32): boolean {
  const hourlyAccountId = 'hourly'
    .concat('-')
    .concat(accountAddress.toHex())
    .concat('-')
    .concat(getHoursSinceEpoch(timestamp))

  return _createActiveAccount(hourlyAccountId)
}

export function _createActiveAccount(accountId: string): boolean {
  let isNewAccount = false

  let account = ActiveAccount.load(accountId)
  if (!account) {
    isNewAccount = true
    account = new ActiveAccount(accountId)
    account.save()
  }
  return isNewAccount
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / shared.constants.SECONDS_PER_DAY)).toString()
}

export function getHoursSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / shared.constants.SECONDS_PER_HOUR)).toString()
}
