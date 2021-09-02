import { wallet } from '../../Providers'
import { Contracts, Trade, UnifiExchange } from '../../Config'
import { PivotArbitrageTraderContract } from '../../Contracts'
import colors from 'colors'
import { ExchangeData } from '../../Types'
import { pathFinder } from './pathFinder'
import { Route, RouteSwap } from './Entities'
import { AsyncLoggerFactory } from '../../Utils/AsyncLogger'
import { calcDeadline, gasLimitToFactorized, normalizeSwapRoute } from '../../Utils/Trade'
import { BN, toHex } from '../../Utils/BigNumber'
import { ethers } from 'ethers'
import { checkProfitability } from '../Utils'

export const PivotArbitrageStrategy = async (
  exchangesData: ExchangeData[],
  pairsDataFile: string
  //pairsData: PairData[]
) => {
  const routes = await pathFinder(exchangesData, pairsDataFile)
  // TODO create pivot trader
  const trader = new PivotArbitrageTraderContract(Contracts.PivotArbitrageTrader, wallet)
  const inputAmount = Trade.tradeAmount

  return async (block: string) => {
    // A forEach doesnt stop on Await, so it's faster
    for (const route of routes) {
      let tradeRoute = route
      try {
        console.log(colors.magenta(`[Trade]`))
        console.log(`Route = ${tradeRoute.name}]`)
        console.log(`Input = ${inputAmount}`)

        let tradeOut = await getTradeOut(tradeRoute, inputAmount)
        let result = checkProfitability(inputAmount, tradeOut.outputAmount)
        console.log(`Output = ${tradeOut.swapOutputAmount}`)
        if (!result.profitable) {
          console.log(`Profitable = false = ${result.percentage}%`)
          continue
        }

        if (result.reversePaths) {
          tradeRoute = tradeRoute.reverse()
          console.log(`RouteReversed = ${tradeRoute.name}]`)
          tradeOut = await getTradeOut(tradeRoute, inputAmount)
          result = checkProfitability(inputAmount, tradeOut.outputAmount)
        }

        const { profitable, percentage } = result
        console.log(`Profitable = ${profitable} = ${result.percentage}%`)

        if (profitable) {
          const res = await trader.trade(
            { route: tradeRoute, inputAmount, expectedOutputAmount: tradeOut.swapOutputAmount },
            {
              gasLimit: BN(tradeOut.gasLimit).multipliedBy(1.5).dp(0).toFixed(0)
            }
          )
          console.log(`TX = https://polygonscan.com/tx/${res.hash}`)
        }
      } catch (error) {
        debugger
        console.error(`[Error] ${route.name}`, error.message)
      }
    }
  }
}
async function getTradeOut(route: Route, amount: string) {
  const [firstSwap, pivotSwap, lastSwap] = route.route
  const firstSwapOut = await amountsOut(firstSwap, amount)
  const pivotSwapOut = await amountsOut(pivotSwap, firstSwapOut)
  const swapOutputAmount = await amountsOut(lastSwap, pivotSwapOut)
  //const underPricedOutputToCalcGas = BN(amount).multipliedBy(0.9).toFixed(0)
  // const gasLimit = await trader.estimateGasForTrade(tradeParamsFactory(underPricedOutputToCalcGas))
  const gasLimit = '563192'

  const outputAmount = BN(swapOutputAmount).minus(gasLimitToFactorized(gasLimit)).toFixed()
  return { outputAmount, swapOutputAmount, gasLimit }
}
async function amountsOut(routeSwap: RouteSwap, amount: string): Promise<string> {
  const { pair, path } = routeSwap

  const firstSwapAmountsOutArg = [toHex(path[0].toPrecision(amount)), normalizeSwapRoute(path)]
  const firstSwapAmountsOut: string[] = await pair.exchange.router
    .getAmountsOut(...firstSwapAmountsOutArg)
    .then((res: ethers.BigNumber[]) =>
      res.map((value, key) => path[key].toFactorized(value.toString()))
    )

  return firstSwapAmountsOut.pop()!
}
