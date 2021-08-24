import { Tokens } from './Tokens'

export const Trade = {
  profitThresholdBelow: 0.997,
  profitThresholdAbove: 1.003,
  tradeAmount: '0.01',
  slippage: '0.01',
  maxDeadline: `${60_000}`,
  nativeToken: Tokens.WMATIC,
  chainId: 137,
  jsonRpcUrl: 'https://rpc-mainnet.maticvigil.com/v1/e7f0574e6b5761ee482f017f4e03c4405e58c7fa'
}
