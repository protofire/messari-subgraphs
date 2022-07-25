import { DoHardWorkCall } from '../../generated/ControllerListener/ControllerContract'
import {
  Deposit,
  StrategyAnnounced,
  StrategyChanged,
  Withdraw as WithdrawEvent,
} from '../../generated/ControllerListener/VaultContract'
import { accounts, events, tokens, protocol as protocols } from '../modules'
import { Vault } from '../../generated/schema'
import { decimal } from '@protofire/subgraph-toolkit'

import { Address, ethereum } from '@graphprotocol/graph-ts'
import { CallType } from '../../../tokemak/src/common/constants'
import { updateFinancials } from '../modules/financials'

export function handleWithdraw(event: WithdrawEvent): void {
  let vault = Vault.load(event.address.toHex())
  let protocol = protocols.loadOrCreateYieldAggregator()

  if (vault) {
    let accountTo = accounts.loadOrCreateAccount(event.params.beneficiary)
    let accountFrom = accounts.loadOrCreateAccount(event.transaction.from)

    let fToken = tokens.setValuesForToken(
      tokens.loadOrCreateToken(event.address),
      tokens.getValuesForToken(event.address),
    )

    let withdrawal = events.withdraws.loadOrCreateWithdraw(
      event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
    )

    withdrawal.protocol = protocol.id
    withdrawal.hash = event.transaction.hash.toHexString()
    withdrawal.logIndex = event.logIndex.toI32()
    withdrawal.timestamp = event.block.timestamp

    withdrawal.from = event.transaction.from.toHexString()
    withdrawal.to = event.params.beneficiary.toHexString()

    withdrawal.blockNumber = event.block.number
    withdrawal.timestamp = event.block.timestamp
    withdrawal.asset = fToken.id
    withdrawal.amount = event.params.amount
    withdrawal.vault = vault.id
    const amountDecimal = decimal.fromBigInt(event.params.amount, fToken.decimals)
    const amountUSD = fToken.lastPriceUSD!.times(amountDecimal)
    withdrawal.amountUSD = amountUSD

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(amountUSD)

    accountFrom.save()
    accountTo.save()
    protocol.save()
    withdrawal.save()

    updateInfomation(event.block, event.transaction.from, event.address, CallType.WITHDRAW)
  }
}

export function handleDeposit(event: Deposit): void {
  let vault = Vault.load(event.address.toHex())
  let protocol = protocols.loadOrCreateYieldAggregator()

  if (vault) {
    let accountTo = accounts.loadOrCreateAccount(event.params.beneficiary)
    let accountFrom = accounts.loadOrCreateAccount(event.transaction.from)

    let fToken = tokens.setValuesForToken(
      tokens.loadOrCreateToken(event.address),
      tokens.getValuesForToken(event.address),
    )

    let deposit = events.deposits.loadOrCreateDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

    deposit.hash = event.transaction.hash.toHexString()
    deposit.logIndex = event.logIndex.toI32()
    deposit.timestamp = event.block.timestamp

    deposit.from = event.transaction.from.toHexString()
    deposit.to = event.params.beneficiary.toHexString()

    deposit.protocol = protocol.id
    deposit.blockNumber = event.block.number
    deposit.timestamp = event.block.timestamp
    deposit.asset = fToken.id
    deposit.amount = event.params.amount
    const amountDecimal = decimal.fromBigInt(event.params.amount, fToken.decimals)
    const amountUSD = fToken.lastPriceUSD!.times(amountDecimal)
    deposit.amountUSD = amountUSD

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD)

    deposit.vault = vault.id

    accountFrom.save()
    accountTo.save()
    protocol.save()
    deposit.save()

    updateInfomation(event.block, event.transaction.from, event.address, CallType.DEPOSIT)
  }
}

function updateInfomation(_block: ethereum.Block, _from: Address, _vaultAddress: Address, _type: string = ''): void {
  updateFinancials(_block.number, _block.timestamp)
  updateUsageMetrics(_block, _from, _type)
  updateVaultSnapshots(_vaultAddress, _block)
}

export function handleStrategyAnnounced(event: StrategyAnnounced): void {}
export function handleStrategyChanged(event: StrategyChanged): void {}
export function handleDoHardWorkCall(call: DoHardWorkCall): void {}
