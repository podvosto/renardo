import { wallet } from '../../Providers'
import { Contracts, Trade } from '../../Config'
import { ArbitrageTraderContract } from '../../Contracts'
import { AsyncLoggerFactory } from '../../Utils/AsyncLogger'
import {
  getPairNonNativeToken,
  getPairNativeToken,
  toHex,
  normalizeSwapRoute,
  BN,
  calcDeadline
} from '../../Utils'
import { ethers } from 'ethers'
import colors from 'colors'
import { ExchangeData, PairData } from '../../Types'
import { exchangesInitializer } from './exchangesInitializer'

export const DirectArbitrageStrategy = async (
  exchangesData: ExchangeData[],
  pairsData: PairData[]
) => {
  const exchanges = await exchangesInitializer(exchangesData, pairsData)
  const arbitrageTrader = new ArbitrageTraderContract(Contracts.ArbitrageTrader, wallet)
  return (block: string) => {
    // A forEach doesnt stop on Await, so it's faster
    exchanges[0].pairs.forEach(async (_: any, i: number) => {
      const logger = AsyncLoggerFactory(block)

      const ex0 = exchanges[0]
      const ex1 = exchanges[1]

      const pairEx0 = ex0.pairs[i]
      const pairEx1 = ex1.pairs[i]

      if (!pairEx0.exists || !pairEx1.exists) {
        return
      }

      logger.log(colors.magenta(`[${pairEx0.name}]`))
      try {
        /**
         * Calc swaps amounts out
         */
        // Swap amount out on Exchange0
        const fromToken = getPairNativeToken(pairEx0, Trade.nativeToken)
        const midToken = getPairNonNativeToken(pairEx0, Trade.nativeToken)
        const route0 = [fromToken, midToken]
        const firstSwapAmountsOutArg = [
          toHex(fromToken.toPrecision(Trade.tradeAmount)),
          normalizeSwapRoute(route0)
        ]
        const firstSwapAmountsOut: string[] = await ex0.router
          .getAmountsOut(...firstSwapAmountsOutArg)
          .then((res: ethers.BigNumber[]) =>
            res.map((value, key) => route0[key].toFactorized(value.toString()))
          )

        const midTokenOut = firstSwapAmountsOut.pop()!

        logger.log(
          `[${ex0.name}] 1st swap: ${Trade.tradeAmount} ${fromToken.symbol} = ${midTokenOut} ${route0[1].symbol}`
        )

        // Swap amount out on Exchange1
        const finalToken = fromToken
        const route1 = [midToken, finalToken]
        const secondSwapAmountsOutArg = [
          toHex(midToken.toPrecision(midTokenOut)),
          normalizeSwapRoute(route1)
        ]
        const secondSwapAmountsOut: string[] = await ex0.router
          .getAmountsOut(...secondSwapAmountsOutArg)
          .then((res: ethers.BigNumber[]) =>
            res.map((value, key) => route1[key].toFactorized(value.toString()))
          )

        const finalTokenOut = secondSwapAmountsOut.pop()!

        logger.log(
          `[${ex1.name}] 2nd swap: ${midTokenOut} ${midToken.symbol} = ${finalTokenOut} ${finalToken.symbol}`
        )

        /**
         * Calc swaps gas limit
         **/

        const firstAmountIn = fromToken.toPrecision(Trade.tradeAmount)

        const tradeArgs = {
          inputAmount: firstAmountIn,
          expectedOutputAmount: BN(firstAmountIn).multipliedBy(0.8).toFixed(0),
          ex0Router: ex0.router.address,
          ex1Router: ex1.router.address,
          ex0Path: normalizeSwapRoute(route0),
          ex1Path: normalizeSwapRoute(route1),
          deadline: calcDeadline()
        }

        const estimatedGas = await arbitrageTrader.estimateGasForTrade(tradeArgs)
        // final token out include LP fee
        const outputAfterTrade = BN(finalTokenOut).minus(estimatedGas).toFixed()

        tradeArgs.expectedOutputAmount = outputAfterTrade

        // Calc profitability
        const difference = BN(outputAfterTrade).dividedBy(Trade.tradeAmount).toFixed()
        const profitableThisWay = BN(difference).isGreaterThan(Trade.profitThresholdAbove)
        const profitableRevertingPaths = BN(difference).isGreaterThan(Trade.profitThresholdBelow)
        if (!profitableThisWay && !profitableRevertingPaths) {
          logger.log('[Skip Trade] No trading opportunity')
        }
        if (profitableThisWay || profitableRevertingPaths) {
          // Calc Swap direction
          const buyOn = profitableRevertingPaths ? ex1 : ex0
          const sellOn = profitableRevertingPaths ? ex0 : ex1

          logger.log(
            colors.green(
              `[Trade Opportunity] ${pairEx0.name} Buy on ${buyOn.name} Sell on ${sellOn.name}`
            )
          )

          let tradeFinalArgs = tradeArgs
          if (profitableRevertingPaths) {
            tradeFinalArgs.ex0Router = tradeFinalArgs.ex1Router
            tradeFinalArgs.ex0Path = tradeFinalArgs.ex1Path
            tradeFinalArgs.ex1Router = tradeFinalArgs.ex0Router
            tradeFinalArgs.ex1Path = tradeFinalArgs.ex0Path
          }

          await arbitrageTrader
            .trade(tradeFinalArgs, { gasLimit: estimatedGas })
            .then((res) => {
              logger.log(
                colors.green('[Successful Tx]'),
                colors.magenta(`https://polygonscan.com/tx/${res.has}`)
              )
            })
            .catch((error) => {
              logger.log(colors.red(`[Failed Tx]`), error)
            })
        }
        logger.print()
      } catch (error) {
        console.error(error)
      }
    })
  }
}
