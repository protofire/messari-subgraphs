import { Address, BigDecimal, BigInt, Entity } from "@graphprotocol/graph-ts";
import { decimal } from "@protofire/subgraph-toolkit";
import { YieldAggregator } from "../../generated/schema"
import { shared } from "./"

export namespace protocol {
	export function getProtocolId(id: Address): string {
		return id.toHexString()
	}
	export function loadOrCreateYieldAggregator(): YieldAggregator {
		let id = getProtocolId(shared.constants.PROTOCOL_ID)
		let entity = YieldAggregator.load(id)
		if (entity == null) {
			entity = new YieldAggregator(id)
			entity.name = shared.constants.PROTOCOL_NAME
			entity.slug = shared.constants.PROTOCOL_SLUG
			entity.schemaVersion = shared.constants.PROTOCOL_SCHEMA_VERSION
			entity.subgraphVersion = shared.constants.PROTOCOL_SUBGRAPH_VERSION
			entity.methodologyVersion = shared.constants.PROTOCOL_METHODOLOGY_VERSION
			entity.network = shared.constants.PROTOCOL_NETWORK
			entity.type = shared.constants.PROTOCOL_TYPE

			entity.totalValueLockedUSD = decimal.ZERO
			entity.protocolControlledValueUSD = decimal.ZERO
			entity.cumulativeSupplySideRevenueUSD = decimal.ZERO
			entity.cumulativeProtocolSideRevenueUSD = decimal.ZERO
			entity.cumulativeTotalRevenueUSD = decimal.ZERO
			entity.cumulativeUniqueUsers = 0;
		}
		return entity as YieldAggregator
	}

	export namespace mutations {

		export function increaseCumulativeTotalRevenueUSD(entity: YieldAggregator, amount: BigDecimal): YieldAggregator {
			let e = entity
			e.cumulativeTotalRevenueUSD = e.cumulativeTotalRevenueUSD.plus(amount)
			return e as YieldAggregator
		}

		export function increaseTotalValueLockedUSD(entity: YieldAggregator, amount: BigDecimal): YieldAggregator {
			let e = entity
			e.totalValueLockedUSD = e.totalValueLockedUSD.plus(amount)
			return e as YieldAggregator
		}

		export function decreaseTotalValueLockedUSD(entity: YieldAggregator, amount: BigDecimal): YieldAggregator {
			let e = entity
			e.totalValueLockedUSD = e.totalValueLockedUSD.minus(amount)
			return e as YieldAggregator
		}

		export function updateCumulativeTotalRevenueUSD(entity: YieldAggregator, oldAmount: BigDecimal, newAmount: BigDecimal): YieldAggregator {
			let e = entity
			e.cumulativeTotalRevenueUSD = e.totalValueLockedUSD.plus(newAmount.minus(oldAmount))
			return e as YieldAggregator
		}

	}

}