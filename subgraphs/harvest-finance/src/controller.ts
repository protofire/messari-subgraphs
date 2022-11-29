import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog,
} from '../generated/Controller/ControllerContract'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { vaults } from './utils/vaults'
import { Token, Vault } from '../generated/schema'
import { prices } from './utils/prices'
import { decimals } from './utils'
import { protocols } from './utils/protocols'
//import { strategies } from './utils/strategies'
import { metrics } from './utils/metrics'
import { timestamp } from '../tests/helpers/asserting/deposits'
import { SharePriceChangeLogEntity } from '../generated/schema'

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vaultAddress = call.inputs._vault
  //let strategyAddress = call.inputs._strategy
  let timestamp = call.block.timestamp
  let blockNumber = call.block.number

  vaults.createVault(vaultAddress, timestamp, blockNumber)

  /*
  let strategy = strategies.getOrCreateStrategy(strategyAddress)
  strategy.vault = vaultAddress.toHexString()
  strategy.save()*/
}

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault
  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  const inputToken = Token.load(vault.inputToken)

  if (!inputToken) return

  const priceUsd = prices.getPricePerToken(Address.fromString(vault.inputToken))

  inputToken.lastPriceUSD = priceUsd
  inputToken.lastPriceBlockNumber = event.block.number

  inputToken.save()

  const oldSharePrice = event.params.oldSharePrice
  const newSharePrice = event.params.newSharePrice

  let debugSupplySideProfit = newSharePrice.minus(oldSharePrice)
  let debugTotalProfit = debugSupplySideProfit
    .times(BigInt.fromI32(100))
    .div(BigInt.fromI32(70))

  const supplySideProfit = decimals.fromBigInt(
    newSharePrice.minus(oldSharePrice),
    inputToken.decimals as u8
  )

  const totalProfit = supplySideProfit
    .times(BigDecimal.fromString('100'))
    .div(BigDecimal.fromString('70'))

  const profitAmountUSD = prices.getPrice(
    Address.fromString(inputToken.id),
    totalProfit
  )

  const feeAmountUSD = prices.getPrice(
    Address.fromString(inputToken.id),
    totalProfit.minus(supplySideProfit)
  )

  const sharePriceChangeLogEntity = new SharePriceChangeLogEntity(
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  )

  sharePriceChangeLogEntity.vault = vault.id
  sharePriceChangeLogEntity.timestamp = event.block.timestamp
  sharePriceChangeLogEntity.blockNumber = event.block.number
  sharePriceChangeLogEntity.oldTVL = vault.totalValueLockedUSD
  sharePriceChangeLogEntity.oldCumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD

  sharePriceChangeLogEntity.oldCumulativeSupplySideUSD =
    vault.cumulativeSupplySideRevenueUSD

  sharePriceChangeLogEntity.totalProfit = debugTotalProfit
  sharePriceChangeLogEntity.supplySideProfit = debugSupplySideProfit
  sharePriceChangeLogEntity.inputToken = Address.fromString(vault.inputToken)
  sharePriceChangeLogEntity.inputTokenDecimals = inputToken.decimals
  sharePriceChangeLogEntity.tokenPrice = prices.getPrice(
    Address.fromString(inputToken.id),
    BigDecimal.fromString('1')
  )

  vaults.updateRevenue(
    vaultAddress.toHexString(),
    profitAmountUSD,
    feeAmountUSD
  )

  sharePriceChangeLogEntity.newCumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD

  sharePriceChangeLogEntity.newCumulativeSupplySideUSD =
    vault.cumulativeSupplySideRevenueUSD

  protocols.updateRevenue(vault.protocol, profitAmountUSD, feeAmountUSD)

  metrics.updateVaultSnapshotsAfterRevenue(
    vaultAddress.toHexString(),
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )

  metrics.updateFinancialsAfterRevenue(
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )

  vault.pricePerShare = decimals.fromBigInt(
    event.params.newSharePrice,
    inputToken.decimals as u8
  )

  const newInputTokenBalance = vaults.extractInputTokenBalance(vaultAddress)

  if (!newInputTokenBalance) return

  vault.totalValueLockedUSD = decimals
    .fromBigInt(newInputTokenBalance, inputToken.decimals as u8)
    .times(priceUsd)

  vault.inputTokenBalance = newInputTokenBalance

  metrics.updateVaultSnapshots(vaultAddress, event.block)
  metrics.updateFinancials(event.block)

  //If theres more input token than before, and the same amount of output token
  //Output token price should be updated

  vault.save()

  sharePriceChangeLogEntity.newTVL = vault.totalValueLockedUSD
  sharePriceChangeLogEntity.save()

  protocols.updateTotalValueLockedUSD(vault.protocol)
}
