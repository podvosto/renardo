import { wallet } from '../../Providers'
import { Config } from '../../Config'
import { PivotArbitrageTraderContract } from '../../Contracts'
import colors from 'colors'
import { Exchange } from '../../Types'
import { pathFinder } from './pathFinder'
import { Route, RouteSwap } from './Entities'
import { gasLimitToFactorized, normalizeSwapRoute } from '../../Utils/Trade'
import { BN, toHex } from '../../Utils/BigNumber'
import { ethers } from 'ethers'
import { checkProfitability } from '../Utils'
import { blackList, isBlackListed } from '../../DataService'

export const PivotArbitrageStrategy = async (exchanges: Exchange[]) => {
  const routesUnfiltered = await pathFinder(exchanges)
  const routes = routesUnfiltered.filter((r) => {
    const hasBlackListed = r.route.find((p) => isBlackListed(p.pair.address))
    return !hasBlackListed
  })

  const trader = new PivotArbitrageTraderContract(Config.PivotArbitrageTrader, wallet)
  const inputAmount = Config.tradeAmount

  return async (block: string) => {
    // A forEach doesnt stop on Await, so it's faster
    for (const route of routes) {
      try {
        await processRoute(route, trader, inputAmount)
        await processRoute(route.reverse(), trader, inputAmount)
      } catch (error) {
        debugger
        console.error(`[Error] ${route.name}`, error.message)
      }
    }
  }
}
async function processRoute(
  tradeRoute: Route,
  trader: PivotArbitrageTraderContract,
  inputAmount: string
) {
  console.log(colors.magenta(`[Trade]`))
  console.log(`Route = ${tradeRoute.name}]`)
  console.log(`Input = ${inputAmount}`)

  let tradeOut = await getTradeOut(tradeRoute, inputAmount, trader)
  let result = checkProfitability(inputAmount, tradeOut.outputAmount)
  console.log(`Output = ${tradeOut.swapOutputAmount}`)
  if (!result.profitable) {
    console.log(`Profitable = false = ${result.percentage}%`)
    return false
  }

  if (result.reversePaths) {
    tradeRoute = tradeRoute.reverse()
    console.log(`RouteReversed = ${tradeRoute.name}]`)
    tradeOut = await getTradeOut(tradeRoute, inputAmount, trader)
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
    res
      .wait(1)
      .then((res) => {
        debugger
      })
      .catch((error) => {
        debugger
      })
    console.log(`TX = https://polygonscan.com/tx/${res.hash}`)
  }
}
async function getTradeOut(
  route: Route,
  inputAmount: string,
  trader: PivotArbitrageTraderContract
) {
  const [firstSwap, pivotSwap, lastSwap] = route.route
  const firstSwapOut = await amountsOut(firstSwap, inputAmount)
  const pivotSwapOut = await amountsOut(pivotSwap, firstSwapOut)
  const swapOutputAmount = await amountsOut(lastSwap, pivotSwapOut)
  const underPricedOutputToCalcGas = BN(inputAmount).multipliedBy(0.9).toFixed()
  const gasLimit = await trader
    .estimateGasForTrade({
      expectedOutputAmount: underPricedOutputToCalcGas,
      inputAmount,
      route
    })
    .catch((error) => {
      const transferFromFailed =
        error?.error?.error?.message === 'execution reverted: TransferHelper: TRANSFER_FROM_FAILED'
      if (transferFromFailed) {
        // as first pair and last one have wmatic token
        // the failing token must be on the pivot pair, therefore ban that pair
        const pivotPair = route.route[1].pair
        blackList(pivotPair.address, pivotPair.name)
      }

      throw error
    })

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
    .catch((err: any) => {
      debugger
      throw err
    })

  return firstSwapAmountsOut.pop()!
}
