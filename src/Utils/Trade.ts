import { BN } from './BigNumber'

export const calcMinAmount = (amount: string, slippage: string) => {
  const factor = BN(1).minus(slippage)
  return BN(amount).multipliedBy(factor).toFixed()
}
