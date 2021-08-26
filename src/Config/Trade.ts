import { Tokens } from './Tokens'

export const Trade = {
  profitThresholdBelow: 0.997,
  profitThresholdAbove: 1.003,
  tradeAmount: '0.01',
  slippage: '0.01',
  maxDeadline: `${60_000}`,
  nativeToken: Tokens.WMATIC // todo: should be parametrizable on config as chainId
}
