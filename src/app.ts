require('dotenv').config()
import { PivotArbitrageStrategy } from './Strategies/PivotArbitrage'
import { envVar } from './Utils/Misc'
import { Exchanges, ExchangesData, PairsByExchange } from './DataService'

import { provider } from './Providers'
import { DirectArbitrageStrategy } from './Strategies/DirectArbitrage'
import { Strategy } from './Types'

async function main() {
  // todo: all traders contract interface (typescript) accepts a Route(RouteSwap[]) as arg.
  // so currently its repeated the logic of consulting amounts out and executing the trade, it could be unified
  // as the only logic that vary from each strategy is the routes calculation in the pathFinder.ts file of each strat
  const traders = await getTraders()

  provider.once('block', async (block) => {
    traders.forEach((trader) => trader(block))
  })
}

function getTraders(): Promise<Array<(block: string) => void>> {
  const enabledStrategies: Strategy[] = envVar('STRATEGIES', '').split(',') as Strategy[]

  const traderPromises = enabledStrategies.map((strategy) =>
    ({
      PIVOT: () => PivotArbitrageStrategy(Exchanges),
      DIRECT: () => DirectArbitrageStrategy(Exchanges)
    }[strategy]())
  )

  return Promise.all(traderPromises)
}

main()
