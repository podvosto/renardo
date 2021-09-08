import { wallet } from '../../Providers'
import { Config } from '../../Config'
import { PivotArbitrageTraderContract } from '../../Contracts'
import colors from 'colors'
import { Exchange } from '../../Types'
import { pivotPathFinder } from './pathFinder'
import { Route } from '../../Route'
import { getTradeOut, txLink } from '../../Utils/Trade'
import { BN } from '../../Utils/BigNumber'
import { checkProfitability } from '../Utils'

export const PivotArbitrageStrategy = async (exchanges: Exchange[]) => {
  const routes = await pivotPathFinder(exchanges)

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
        console.error(`[Error] ${route.name}`, error)
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
  let { profitable, percentage } = checkProfitability(inputAmount, tradeOut.outputAmount)
  console.log(`Output = ${tradeOut.swapOutputAmount}`)
  console.log(`Profitable = ${profitable} = ${percentage}%`)

  if (!profitable) {
    return false
  }

  const res = await trader.trade(
    { route: tradeRoute, inputAmount, expectedOutputAmount: tradeOut.swapOutputAmount },
    {
      gasLimit: BN(tradeOut.gasLimit).multipliedBy(1.5).dp(0).toFixed(0)
    }
  )
  console.log(`TX = ${txLink(res.hash)}`)

  res
    .wait(1)
    .then((res) => {
      debugger
    })
    .catch((error) => {
      debugger
    })
}
