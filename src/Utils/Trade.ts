import { Trade } from '../Config'
import { Token } from '../Types'
import { BN, toHex } from './BigNumber'

export const calcMinAmount = (amount: string, slippage: string, decimals?: number) => {
  const factor = BN(1).minus(slippage)
  const out = BN(amount).multipliedBy(factor)
  if (decimals === undefined) {
    return out.toFixed()
  }
  return out.toFixed(decimals)
}

export const normalizeSwapRoute = (tokens: Token[]) => tokens.map((t) => t.address)
export const calcDeadline = (deadline: string = Trade.maxDeadline) => {
  return toHex(
    BN(Date.now() + deadline)
      .dividedBy(1000)
      .toFixed(0)
  )
}

export const gasLimitToFactorized = (gasLimit: string) =>
  BN(gasLimit).dividedBy(Math.pow(10, 9)).toFixed()
