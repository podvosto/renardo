import { wallet } from '../../Providers'
import { Config } from '../../Config'
import { DirectArbitrageTraderContract } from '../../Contracts'
import { BN } from '../../Utils/BigNumber'
import { getTradeOut, txLink } from '../../Utils/Trade'
import colors from 'colors'
import { Exchange } from '../../Types'
import { directPathFinder } from './pathFinder'
import { checkProfitability } from '../Utils'

export const DirectArbitrageStrategy = async (exchanges: Exchange[]) => {
  const routes = await directPathFinder(exchanges)
  const trader = new DirectArbitrageTraderContract(Config.DirectArbitrageTrader, wallet)
  const inputAmount = Config.tradeAmount

  return async (block: string) => {
    for (const route of routes) {
      try {
        let tradeOut = await getTradeOut(route, inputAmount, trader)
        let { profitable, percentage } = checkProfitability(inputAmount, tradeOut.outputAmount)
        console.log(colors.magenta(`[Trade]`))
        console.log(`Route = ${route.name}]`)
        console.log(`Input = ${inputAmount}`)
        console.log(`Output = ${tradeOut.swapOutputAmount}`)
        console.log(`Profitable = ${profitable} = ${percentage}%`)

        if (!profitable) {
          continue
        }

        const res = await trader.trade(
          { route, inputAmount, expectedOutputAmount: tradeOut.swapOutputAmount },
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
      } catch (error) {
        debugger
        console.error(`[Error] ${route.name}`, error)
      }
    }
  }
}
