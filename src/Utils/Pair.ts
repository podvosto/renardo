import { Config } from '../Config'
import { Exchange, ExchangePairsData, Pair, PairData, Token } from '../Types'

export const getPairNativeToken = (pair: Pair, nativeToken: Token = Config.nativeToken) => {
  if (nativeToken.equals(pair.token0)) return pair.token0
  if (nativeToken.equals(pair.token1)) return pair.token1
  throw new Error('Pair does not have native token')
}

export const getPairNonNativeToken = (pair: Pair, nativeToken: Token = Config.nativeToken) => {
  if (!nativeToken.equals(pair.token0)) return pair.token0
  if (!nativeToken.equals(pair.token1)) return pair.token1
  throw new Error('Pair does not have non native token')
}

export const NOT_FOUND_PAIR_ADDRESS = '0x0'

export const mixAllExchangePairs = (exchanges: Exchange[]): Pair[] => {
  return exchanges.reduce((list, ex) => [...list, ...ex.pairs], [] as Pair[])
}
