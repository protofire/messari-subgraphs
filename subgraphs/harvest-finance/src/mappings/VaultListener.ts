import { DoHardWorkCall } from '../../generated/ControllerListener/ControllerContract'
import {
  Deposit,
  StrategyAnnounced,
  StrategyChanged,
  Withdraw as WithdrawEvent,
} from '../../generated/ControllerListener/VaultContract'
import { accounts, events, tokens, protocol as protocols, shared } from '../modules'
import { Token, Vault } from '../../generated/schema'
import { decimal } from '@protofire/subgraph-toolkit'

import { Address, ethereum, BigInt } from '@graphprotocol/graph-ts'
import { updateFinancials } from '../modules/financials'
import { updateUsageMetrics } from '../modules/usage'
import { vaults } from '../modules/vaults'
import { Vault as VaultContract } from '../../generated/ControllerListener/Vault'

export function handleWithdraw(event: WithdrawEvent): void {
  let vault = Vault.load(event.address.toHex())
  let protocol = protocols.loadOrCreateYieldAggregator()

  if (vault) {
    let accountTo = accounts.loadOrCreateAccount(event.params.beneficiary)
    let accountFrom = accounts.loadOrCreateAccount(event.transaction.from)

    const inputToken = Token.load(vault.inputToken)!
    const outputToken = Token.load(vault.outputToken!)!

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
    withdrawal.asset = inputToken.id
    withdrawal.amount = event.params.amount
    withdrawal.vault = vault.id

    const amountDecimal = decimal.fromBigInt(event.params.amount, inputToken.decimals)
    const amountUSD = inputToken.lastPriceUSD!.times(amountDecimal)
    withdrawal.amountUSD = amountUSD

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(amountUSD)

    let pricePerFullShare = getPriceShare(event.address)
    vault.pricePerShare = pricePerFullShare.toBigDecimal()

    let underlyingUnit = BigInt.fromI64(tokens.helpers.getUnderlyingUnit(outputToken.decimals))
    let toMint = event.params.amount.times(underlyingUnit).div(pricePerFullShare)

    const tvl = vault.inputTokenBalance.minus(event.params.amount)
    vault.totalValueLockedUSD = amountUSD.times(tvl.div(BigInt.fromI32(inputToken.decimals)).toBigDecimal())
    vault.inputTokenBalance = tvl

    // TODO outputTokenSupply && outputTokenPriceUSD
    vault.outputTokenSupply = vault.outputTokenSupply!.plus(
      convertTokenDecimals(toMint, inputToken.decimals, outputToken.decimals),
    )

    accountFrom.save()
    accountTo.save()
    protocol.save()
    vault.save()
    withdrawal.save()

    updateInfomation(event.block, event.transaction.from, event.address, shared.constants.CallType.WITHDRAW)
  }
}

export function handleDeposit(event: Deposit): void {
  let vault = Vault.load(event.address.toHex())
  let protocol = protocols.loadOrCreateYieldAggregator()

  if (vault) {
    let accountTo = accounts.loadOrCreateAccount(event.params.beneficiary)
    let accountFrom = accounts.loadOrCreateAccount(event.transaction.from)

    /* let fToken = tokens.setValuesForToken(
      tokens.loadOrCreateToken(event.address),
      tokens.getValuesForToken(event.address),
    ) */

    // FIXME inputToken is nullable
    let inputToken = Token.load(vault.inputToken)!
    let outputToken = Token.load(vault.outputToken!)!

    let deposit = events.deposits.loadOrCreateDeposit(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

    deposit.hash = event.transaction.hash.toHexString()
    deposit.logIndex = event.logIndex.toI32()
    deposit.timestamp = event.block.timestamp

    deposit.from = event.transaction.from.toHexString()
    deposit.to = event.params.beneficiary.toHexString()

    deposit.protocol = protocol.id
    deposit.blockNumber = event.block.number
    deposit.timestamp = event.block.timestamp
    deposit.asset = vault.inputToken
    deposit.amount = event.params.amount
    deposit.vault = vault.id

    const amountDecimal = decimal.fromBigInt(event.params.amount, inputToken.decimals)
    const amountUSD = inputToken.lastPriceUSD!.times(amountDecimal)
    deposit.amountUSD = amountUSD

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(amountUSD)

    let pricePerFullShare = getPriceShare(event.address)
    vault.pricePerShare = pricePerFullShare.toBigDecimal()

    let underlyingUnit = BigInt.fromI64(tokens.helpers.getUnderlyingUnit(outputToken.decimals))
    let toMint = event.params.amount.times(underlyingUnit).div(pricePerFullShare)

    const tvl = vault.inputTokenBalance.plus(event.params.amount)
    vault.totalValueLockedUSD = amountUSD.times(tvl.div(BigInt.fromI32(inputToken.decimals)).toBigDecimal())
    vault.inputTokenBalance = tvl

    // TODO outputTokenSupply && outputTokenPriceUSD

    vault.outputTokenSupply = vault.outputTokenSupply!.minus(
      convertTokenDecimals(toMint, inputToken.decimals, outputToken.decimals),
    )

    /* vault.outputTokenPriceUSD = inputToken.lastPriceUSD!.times(
      convertTokenDecimals(decimals, inputToken.decimals, outputToken.decimals).toBigDecimal(),
    ) */

    accountFrom.save()
    accountTo.save()
    protocol.save()
    vault.save()
    deposit.save()

    updateInfomation(event.block, event.transaction.from, event.address, shared.constants.CallType.DEPOSIT)
  }
}
function getPriceShare(_address: Address): BigInt {
  let vaultContract = VaultContract.bind(_address)
  return shared.readValue<BigInt>(vaultContract.try_getPricePerFullShare(), BigInt.zero())
}

function convertTokenDecimals(amount: BigInt, inputDecimals: number, outputDecimals: number): BigInt {
  return amount
    .times(shared.constants.BIGINT_TEN.pow(u8(outputDecimals)))
    .div(shared.constants.BIGINT_TEN.pow(u8(inputDecimals)))
}

function updateInfomation(_block: ethereum.Block, _from: Address, _vaultAddress: Address, _type: string = ''): void {
  updateFinancials(_block.number, _block.timestamp)
  updateUsageMetrics(_block, _from, _type)
  vaults.updateVaultSnapshots(_vaultAddress, _block)
}

export function handleStrategyAnnounced(event: StrategyAnnounced): void {}
export function handleStrategyChanged(event: StrategyChanged): void {}
export function handleDoHardWorkCall(call: DoHardWorkCall): void {}
