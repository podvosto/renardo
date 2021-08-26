require('dotenv').config()

import { Exchanges, Pairs } from './Config'

import { provider } from './Providers'
import { DirectArbitrageStrategy } from './Strategies/DirectArbitrage'

async function main() {
  const directStrategyTrade = await DirectArbitrageStrategy(Exchanges, Pairs)

  provider.on('block', async (block) => {
    directStrategyTrade(block)
  })
}

main()
