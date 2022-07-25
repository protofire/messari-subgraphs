import { Address, Bytes } from "@graphprotocol/graph-ts";
import { decimal } from "@protofire/subgraph-toolkit";
import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../../generated/ControllerListener/ControllerContract";
import { Vault } from "../../generated/schema";
import { StrategyListener, VaultListener } from "../../generated/templates";
import { oracles, protocol as protocols, tokens, vaults } from "../modules";

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
	let vault = vaults.loadOrCreateVault(event.params.vault)
	vault.pricePerShare = decimal.fromBigInt(event.params.newSharePrice)
	let tokenAddress = Address.fromBytes(Bytes.fromHexString(vault.inputToken))
	let underLyingToken = tokens.loadOrCreateToken(tokenAddress)
	// FIXME: use helper properly
	underLyingToken.lastPriceUSD = oracles.getUsdPricePerToken(tokenAddress).usdPrice
	// TODO is this calc accurate?
	let protocol = protocols.loadOrCreateYieldAggregator()
	protocol = protocols.mutations.updateCumulativeTotalRevenueUSD(
		protocol,
		decimal.fromBigInt(event.params.oldSharePrice),
		decimal.fromBigInt(event.params.newSharePrice),
	)
	protocol.save()
	vault.save()
}

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
	let vaultId = call.inputs._vault.toHexString()
	let vault = Vault.load(vaultId)
	if (vault == null) {
		// TASK: creates a vault and it's strategy
		// Can be improved by handleInitializeVault from the vault Factory

		let vaultResults = vaults.getValuesForVault(call.inputs._vault)

		let inputToken = tokens.setValuesForToken(

			tokens.loadOrCreateToken(vaultResults.underLyingToken),
			tokens.getValuesForToken(vaultResults.underLyingToken)
		)
		inputToken.save()

		let outpuToken = tokens.setValuesForToken(
			tokens.loadOrCreateToken(vaultResults.underLyingToken),
			new tokens.TokenValuesresult(
				`FARM_${inputToken.name}`,
				`f${inputToken.symbol}`,
				inputToken.decimals
			)
		)
		outpuToken.id = `f${outpuToken.id}`
		outpuToken.save()


		let vault = vaults.loadOrCreateVault(call.inputs._vault)

		vault.symbol = vaultResults.symbol
		vault.name = vaultResults.name

		vault.createdTimestamp = call.block.timestamp
		vault.createdBlockNumber = call.block.number

		vault.inputToken = inputToken.id
		vault.outputToken = outpuToken.id

		vault.createdBlockNumber = call.block.number
		vault.createdTimestamp = call.block.timestamp

		// TODO: strategy = lotor strategy 
		// TODO: vault.strategy = strategy.id

		vault.save()

		// TODO: vault.outputTokenPriceUSD = ?
		// TODO: vault.outputTokenSupply = ? // contract call
		// TODO: vault.inputTokenBalance = ?
		// TODO: if (symbol == 'fUNI-V2') && get explanations

		// let vaultFee = vaultFees.loadOrCreateVaultFee(vault.id)
		// vault = vaults.addFee(vault, vaultFee.id)

		// let vaultFeeResults = vaultFees.getValuesForVaultFee(vaultResults.controllerAddress)
		// vaultFee.feePercentage = vaultFeeResults.profitSharingNumerator.toBigDecimal()
		// 	.div(vaultFeeResults.profitSharingNumerator.toBigDecimal())
		// 	.times(shared.constants.BIGINT_HUNDRED.toBigDecimal())
		// vaultFee.save()
		// vault.save()

		let protocol = protocols.loadOrCreateYieldAggregator()
		protocol.save()
		VaultListener.create(call.inputs._vault)
		StrategyListener.create(call.inputs._strategy)
	}
}