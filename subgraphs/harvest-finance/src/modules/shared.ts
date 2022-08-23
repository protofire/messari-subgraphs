import { ethereum } from '@graphprotocol/graph-ts'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@protofire/subgraph-toolkit'

export namespace shared {

  export namespace helpers {
    export function safeDiv(a: BigInt, b: BigInt): BigInt {
      return b.lt(integer.ONE) ? a.div(integer.ONE) : a.div(b)

    }
  }

  // TODO add this to toolkit
  export function readValue<T>(callResult: ethereum.CallResult<T>, fallBackValue: T): T {
    return callResult.reverted ? fallBackValue : callResult.value
  }

  export namespace date {
    export let SECONDS_IN_MINUTE = 60 * 60
    export let SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60
    export let SECONDS_IN_DAY = SECONDS_IN_HOUR * 24
    export let SECONDS_IN_WEEK = SECONDS_IN_DAY * 7

    export let ONE_MINUTE = BigInt.fromI32(SECONDS_IN_MINUTE)
    export let ONE_HOUR = BigInt.fromI32(SECONDS_IN_MINUTE)
    export let ONE_DAY = BigInt.fromI32(SECONDS_IN_HOUR)
    export let ONE_WEEK = BigInt.fromI32(SECONDS_IN_DAY)

    export function truncateDate(timestamp: BigInt, interval: BigInt): BigInt {
      return timestamp.div(interval).times(interval)
    }

    // export function truncateSeconds(timestamp: BigInt): BigInt {
    // 	return truncateDate(timestamp, ONE_MINUTE)
    // }

    export function truncateMinutes(timestamp: BigInt): BigInt {
      return truncateDate(timestamp, ONE_MINUTE)
    }

    export function truncateHours(timestamp: BigInt): BigInt {
      return truncateDate(timestamp, ONE_HOUR)
    }

    export function truncateDays(timestamp: BigInt): BigInt {
      return truncateDate(timestamp, ONE_DAY)
    }

    export function truncateWeeks(timestamp: BigInt): BigInt {
      return timestamp.div(ONE_WEEK).times(ONE_WEEK)
    }
  }

  export namespace constants {
    export namespace CallType {
      export const DEPOSIT = 'DEPOSIT'
      export const WITHDRAW = 'WITHDRAW'
    }

    export namespace VaultFeeType {
      export const MANAGEMENT_FEE = 'MANAGEMENT_FEE'
      export const PERFORMANCE_FEE = 'PERFORMANCE_FEE'
      export const DEPOSIT_FEE = 'DEPOSIT_FEE'
      export const WITHDRAWAL_FEE = 'WITHDRAWAL_FEE'
    }

    export namespace RewardTokenType {
      export const DEPOSIT = 'DEPOSIT'
      export const BORROW = 'BORROW'
    }

    // default usdc denominator
    export const USDC_DENOMINATOR = BigInt.fromString('1000000')

    // default no of decimals for tokens
    export const DEFAULT_DECIMALS = 18

    // number values
    export const BIGINT_ZERO = BigInt.fromI32(0)
    export const BIGINT_TEN = BigInt.fromI32(10)
    export const BIGINT_HUNDRED = BigInt.fromString('100')
    export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO)
    export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN)
    export const BIGDECIMAL_HUNDRED = BigDecimal.fromString('100')

    // no of seconds of a day
    export const SECONDS_PER_DAY = 84600
    export const SECONDS_PER_HOUR = 3600

    export const PROTOCOL_ID = Address.fromString('0x222412af183BCeAdEFd72e4Cb1b71f1889953b1C')
    export const PROTOCOL_NAME = 'Harvest Finance'
    export const PROTOCOL_SLUG = 'harvest-finance'
    export const PROTOCOL_TYPE = 'YIELD'
    export const PROTOCOL_NETWORK = 'MAINNET'
    export const PROTOCOL_SCHEMA_VERSION = '1.2.0'
    export const PROTOCOL_SUBGRAPH_VERSION = '1.0.0'
    export const PROTOCOL_METHODOLOGY_VERSION = '1.0.0'

    // null address
    export const NULL_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

    // chainlink's token price contract

    // Tokens
    export const WETH_ADDRESS = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
  }
}
