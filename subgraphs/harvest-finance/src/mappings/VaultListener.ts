import { DoHardWorkCall } from '../../generated/ControllerListener/ControllerContract'
import {
	Deposit,
	StrategyAnnounced,
	StrategyChanged,
	Withdraw as WithdrawEvent,
} from '../../generated/ControllerListener/VaultContract'
import { accounts, events, tokens, protocol as protocols, vaults } from '../modules'
import { Token, Vault } from '../../generated/schema'
import { decimal, integer } from '@protofire/subgraph-toolkit'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleStrategyChanged(event: StrategyChanged): void {
	// TODO: withDraw all from old strategy to vault // IStrategy(strategy()).withdrawAllToVault();
}

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
		withdrawal.amountUSD = fToken.lastPriceUSD!.times(amountDecimal)

		protocol = protocols.mutations.decreaseTotalValueLockedUSD(protocol, withdrawal.amountUSD)

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

		// FIXME inputToken is nullable
		let inputToken = Token.load(vault.inputToken)!


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
		const amountDecimal = decimal.fromBigInt(event.params.amount, inputToken.decimals)
		deposit.amountUSD = inputToken.lastPriceUSD!.times(amountDecimal)


		// 65:Vault.sol @  uint256 toMint = amount.mul(underlyingUnit()).div(getPricePerFullShare());
		// amount of vault token to be transffered aka outToken  _mint(beneficiary, toMint);
		let toMint = decimal.fromBigInt(event.params.amount).times(decimal.fromNumber(
			tokens.helpers.getUnderlyingUnit(
				inputToken.decimals
			)
		)).div(inputToken.lastPriceUSD!)
		// FIXME: getPricePerFullShare != inputToken.lastPriceUSD
		/*
		148: Vault.sol @
		function getPricePerFullShare() public view returns (uint256) {
			return totalSupply() == 0
				? underlyingUnit()
				: underlyingUnit().mul(underlyingBalanceWithInvestment()).div(totalSupply());
			}
		*/

		deposit.vault = vault.id

		protocol = protocols.mutations.increaseTotalValueLockedUSD(protocol, deposit.amountUSD)

		accountFrom.save()
		accountTo.save()
		protocol.save()
		deposit.save()
	}
}



export function handleStrategyAnnounced(event: StrategyAnnounced): void { }
export function handleDoHardWorkCall(call: DoHardWorkCall): void { }
