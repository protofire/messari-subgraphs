
import { shared } from "./"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { decimal, integer } from "@protofire/subgraph-toolkit"
import { ERC20 } from "../../generated/ControllerListener/ERC20";
import { RewardToken, Token } from "../../generated/schema"


export namespace tokens {
	export function parseTokenId(id: Address): string {
		// TODO is there some messari parsing standard?
		return id.toHexString()
	}

	export function loadOrCreateRewardToken(address: Address, type: string): RewardToken {
		let tokenId = parseTokenId(address)
		let id = `${type}-${tokenId}`

		let entity = RewardToken.load(id)
		if (entity == null) {
			entity = new RewardToken(id)
			entity.token = tokenId
			entity.type = type
		}
		return entity as RewardToken
	}

	export function loadOrCreateToken(address: Address): Token {
		let id = parseTokenId(address)
		let entity = Token.load(id)
		if (entity == null) {
			let result = getValuesForToken(address)
			entity = new Token(id)
			entity.name = result.name
			entity.symbol = result.symbol
			entity.decimals = result.decimals
			entity.lastPriceUSD = decimal.ZERO
			entity.lastPriceBlockNumber = integer.ZERO
		}
		return entity as Token
	}

	export namespace helpers {
		export const getUnderlyingUnit = (decimals: i32) => 10 ** decimals;
	}

	// TODO loadOrCreateRewardToken

	export function getValuesForToken(address: Address): TokenValuesresult {
		let erc20Contract = ERC20.bind(address)
		return new TokenValuesresult(
			shared.readValue<string>(erc20Contract.try_name(), `fallBackValueFor ${address.toHexString()}`),
			shared.readValue<string>(erc20Contract.try_symbol(), `fallBackValueFor ${address.toHexString()}`),
			(shared.readValue<BigInt>(erc20Contract.try_decimals(), integer.ZERO)).toI32()
		)
	}


	export function setValuesForToken(_token: Token, values: TokenValuesresult): Token {
		let token = _token
		token.name = values.name
		token.symbol = values.symbol
		token.decimals = values.decimals
		return token
	}


	export class TokenValuesresult {
		// TODO how to reduce verbosity on ResultType Classes
		name: string
		symbol: string
		decimals: i32
		constructor(
			_name: string,
			_symbol: string,
			_decimals: i32
		) {
			this.name = _name
			this.symbol = _symbol
			this.decimals = _decimals
		}
	}
}