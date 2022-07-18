import { AddVaultAndStrategyCall, SharePriceChangeLog } from "../../generated/ControllerListener/ControllerContract";
import { StrategyListener } from "../../generated/templates";
import { accounts, protocol, shared, tokens, vaultFees, vaults } from "../modules";

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void { }

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
	// TODO warp this

	let account = accounts.loadOrCreateAccount(call.from) // this should be an eoa
	account.save()
	let activeAccount = accounts.loadOrCreateActiveAccount(call.from, call.block.timestamp)
	activeAccount.save()

	let vault = vaults.loadOrCreateVault(call.inputs._vault)
	let vaultResults = vaults.getValuesForVault(call.inputs._vault)
	vault.symbol = vaultResults.symbol
	vault.name = vaultResults.name


	let underLyingToken = tokens.setValuesForToken(
		tokens.loadOrCreateToken(vaultResults.underLyingToken),
		tokens.getValuesForToken(vaultResults.underLyingToken)
	)
	underLyingToken.save()

	let fToken = tokens.setValuesForToken(
		tokens.loadOrCreateToken(call.inputs._vault),
		tokens.getValuesForToken(call.inputs._vault)
	)
	fToken.save()

	vault.name = `${shared.constants.PROTOCOL_NAME}-${underLyingToken.name}`
	vault.inputToken = underLyingToken.id
	vault.outputToken = fToken.id
	vault.save()

	// TODO: if (symbol == 'fUNI-V2') && get explanations

	let vaultFee = vaultFees.loadOrCreateVaultFee(vault.id)
	vault = vaults.addFee(vault, vaultFee.id)

	let vaultFeeResults = vaultFees.getValuesForVaultFee(vaultResults.controllerAddress)
	vaultFee.feePercentage = vaultFeeResults.profitSharingNumerator.toBigDecimal()
		.div(vaultFeeResults.profitSharingNumerator.toBigDecimal())
		.times(shared.constants.BIGINT_HUNDRED.toBigDecimal())


	vaultFee.save()
	vault.save()

	let haverstFinanceOverview = protocol.loadOrCreateYieldAggregator()
	haverstFinanceOverview.save()

	StrategyListener.create(call.inputs._strategy)
}