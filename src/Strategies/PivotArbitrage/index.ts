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
  const arbitrageTrader = new PivotArbitrageTraderContract(Contracts.PivotArbitrageTrader, wallet)
  return async (block: string) => {
    // A forEach doesnt stop on Await, so it's faster
    getRandom<Route[]>(routes, 100).forEach(async (route) => {
      const logger = AsyncLoggerFactory(`\n[Block #${block}]`)

      try {
        let tradeResult = await route.trade(Trade.tradeAmount)

        const { profitable, outputAfterTrade, percentage } = tradeResult

        logger.log(
          [
            colors.magenta(`[Trade]`),
            `Route = ${route.name}]`,
            `Input = ${Trade.tradeAmount}`,
            `Output = ${outputAfterTrade}`,
            `Profitable = ${profitable} (${percentage}%)`
          ].join('\n')
        )

        //  else if (BN(percentage).abs().isGreaterThan('0.5')) {
        //   debugger
        // }
        logger.print()
        if (profitable) {
          debugger
        }
      } catch (error) {
        debugger
      }
    })
  }
}
