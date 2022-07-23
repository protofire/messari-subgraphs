import { DoHardWorkCall } from '../../generated/ControllerListener/ControllerContract'
import {
  Deposit,
  StrategyAnnounced,
  StrategyChanged,
  Withdraw as WithdrawEvent,
} from '../../generated/ControllerListener/VaultContract'
import { accounts, events, tokens, protocol as protocols } from '../modules'
import { Vault, Withdraw } from '../../generated/schema'

import { BigInt, Address, Bytes, log, BigDecimal, ethereum } from '@graphprotocol/graph-ts'

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
    withdrawal.amountUSD = fToken.lastPriceUSD!.times(new BigDecimal(event.params.amount))
    withdrawal.vault = vault.id

    accountFrom.save()
    accountTo.save()
    protocol.save()
    withdrawal.save()
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
    deposit.amountUSD = fToken.lastPriceUSD!.times(new BigDecimal(event.params.amount))
    deposit.vault = vault.id

    accountFrom.save()
    accountTo.save()
    protocol.save()
    deposit.save()
  }
}

export function handleStrategyAnnounced(event: StrategyAnnounced): void {}
export function handleStrategyChanged(event: StrategyChanged): void {}
export function handleDoHardWorkCall(call: DoHardWorkCall): void {}
