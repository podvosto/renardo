import { Pair, Token } from '../Types'

export const getPairNativeToken = (pair: Pair, nativeToken: Token) => {
  if (nativeToken.equals(pair.token0)) return pair.token0
  if (nativeToken.equals(pair.token1)) return pair.token1
  throw new Error('Pair does not have native token')
}

export const getPairNonNativeToken = (pair: Pair, nativeToken: Token) => {
  if (!nativeToken.equals(pair.token0)) return pair.token0
  if (!nativeToken.equals(pair.token1)) return pair.token1
  throw new Error('Pair does not have non native token')
}
