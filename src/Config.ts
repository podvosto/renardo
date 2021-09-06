import { Token } from './Types'
import { envVar } from './Utils/Misc'

const blockchainDataById: Record<string, { token: Token; name: string }> = {
  137: {
    token: new Token('WMATIC', '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 18),
    name: 'polygon'
  },
  56: {
    token: new Token('WBNB', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18),
    name: 'binance'
  }
}

const chainId = envVar('CHAIN_ID')
export const Config = {
  jsonRpcUrl: envVar('PROVIDER_JSON_RPC_URL'),
  chainId: Number(chainId),
  blockchain: blockchainDataById[chainId].name,
  privateKey: envVar('WALLET_PRIVATE_KEY'),
  nativeToken: blockchainDataById[chainId].token,
  // Trade config
  profitThresholdBelow: 0.995,
  profitThresholdAbove: 1.005,
  tradeAmount: `${envVar('TRADE_AMOUNT')}`,
  slippage: '0.01',
  maxDeadline: `${60_000}`,

  // Contracts
  DirectArbitrageTrader: envVar('DIRECT_ARBITRAGE_TRADER_ADDR'),
  PivotArbitrageTrader: envVar('PIVOT_ARBITRAGE_TRADER_ADDR')
}
