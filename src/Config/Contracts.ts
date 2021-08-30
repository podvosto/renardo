import { envVar } from '../Utils/Misc'

export const Contracts = {
  DirectArbitrageTrader: envVar('DIRECT_ARBITRAGE_TRADER_ADDR'),

  PivotArbitrageTrader: envVar('PIVOT_ARBITRAGE_TRADER_ADDR')
}
