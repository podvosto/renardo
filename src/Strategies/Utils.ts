import { Trade } from '../Config'
import { BN } from '../Utils/BigNumber'

interface ProfitabilityResult {
  profitable: boolean
  reversePaths: boolean
  percentage: string
}

export function checkProfitability(inputAmount: string, outputAmount: string): ProfitabilityResult {
  const difference = BN(outputAmount).dividedBy(inputAmount).toFixed()
  const profitableThisWay = BN(difference).isGreaterThan(Trade.profitThresholdAbove)
  const profitableRevertingPaths = BN(difference).isGreaterThan(Trade.profitThresholdBelow)

  const percentage = BN(1).minus(difference).abs().multipliedBy('100').toFixed(4)
  const profitable = profitableThisWay || profitableRevertingPaths
  return {
    profitable,
    reversePaths: profitableRevertingPaths,
    percentage: profitable ? percentage : `-${percentage}`
  }
}
