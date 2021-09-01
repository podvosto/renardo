import { wallet } from '../../Providers'
import { Contracts, Trade } from '../../Config'
import { PivotArbitrageTraderContract } from '../../Contracts'
import colors from 'colors'
import { ExchangeData } from '../../Types'
import { pathFinder } from './pathFinder'
import { Route } from './Entities'
import { AsyncLoggerFactory } from '../../Utils/AsyncLogger'
import { getRandom } from '../../Utils/Misc'

export const PivotArbitrageStrategy = async (
  exchangesData: ExchangeData[],
  pairsDataFile: string
  //pairsData: PairData[]
) => {
  const routes = await pathFinder(exchangesData, pairsDataFile)
  // TODO create pivot trader
  const trader = new PivotArbitrageTraderContract(Contracts.PivotArbitrageTrader, wallet)
  return async (block: string) => {
    // A forEach doesnt stop on Await, so it's faster
    getRandom<Route[]>(routes, routes.length).forEach(async (route) => {
      const logger = AsyncLoggerFactory(`\n[Block #${block}]`)
      if (route.route[1].pair.address !== '0xcddf91a44c579765227722da371136a4f12dc81b') {
        return
      }
      try {
        let tradeResult = await route.prepareTrade(Trade.tradeAmount, trader).catch((err) => {
          debugger
          throw err
        })

        const { profitable, outputAfterTrade, reversePaths, percentage } = tradeResult

        let execution: any = false
        if (profitable) {
          execution = await tradeResult
            .execute()
            .then((res) => {
              debugger
              return res
            })
            .catch((err) => {
              throw err
              debugger
            })
        }

        logger.log(
          [
            colors.magenta(`[Trade]`),
            `Route = ${route.name}]`,
            `Input = ${Trade.tradeAmount}`,
            `Output = ${outputAfterTrade}`,
            `Profitable = ${profitable} (${percentage}%)`,
            `Execution:`,
            execution?.hash
          ].join('\n')
        )

        logger.print()
      } catch (error) {
        debugger
        //console.error(`[Error] ${route.name}`, error.message)
      }
    })
  }
}
