import { decimal } from "@protofire/subgraph-toolkit";
import { DoHardWorkCall } from "../../generated/ControllerListener/ControllerContract";
import { Deposit, StrategyAnnounced, StrategyChanged } from "../../generated/ControllerListener/VaultContract";
import { Withdraw } from "../../generated/schema";
import { accounts, vaults } from "../modules";

export function handleDeposit(event: Deposit): void {

	let account = accounts.loadOrCreateActiveAccount(event.params.beneficiary, event.block.timestamp)
	account.save()
	// Increase protocl users



	let vault = vaults.loadOrCreateVault(event.address)
	vault.save()
}

export function handleWithdraw(event: Withdraw): void { }
export function handleStrategyAnnounced(event: StrategyAnnounced): void { }
export function handleStrategyChanged(event: StrategyChanged): void { }
export function handleDoHardWorkCall(call: DoHardWorkCall): void { }
