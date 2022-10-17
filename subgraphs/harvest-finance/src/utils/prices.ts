import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { chainlink } from './pricies/chainlink'
import { yearnLens } from './pricies/yearnLens'
import { uniswap } from './pricies/uniswap'

export namespace prices {
  export function getPricePerToken(tokenAddress: Address): BigDecimal {
    const chainLinkPricePerToken = chainlink.getPrice(tokenAddress)

    if (chainLinkPricePerToken) return chainLinkPricePerToken

    const yearnLensPricePerToken = yearnLens.getPrice(tokenAddress)

    if (yearnLensPricePerToken) return yearnLensPricePerToken

    const uniswapPrice = uniswap.getPrice(tokenAddress)

    if (uniswapPrice) return uniswapPrice

    return BigDecimal.fromString('0')
  }

  export function getPrice(
    tokenAddress: Address,
    amount: BigDecimal
  ): BigDecimal {
    return getPricePerToken(tokenAddress).times(amount)
  }
}
