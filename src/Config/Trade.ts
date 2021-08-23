import { Tokens } from './Tokens'

export const Trade = {
  profitThresholdBelow: 0.997,
  profitThresholdAbove: 1.003,
  tradeAmount: '0.01',
  slippage: '0.01',
  maxDeadline: `${60_000}`,
  nativeToken: Tokens.WMATIC,
  chainId: 137,
  jsonRpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/fD5HjNcSOLvLdY1-Os1sPs9iGmrrpO4A'
}
