import { envVar } from '../Utils/Misc'
import { Tokens } from './Tokens'

export const Trade = {
  profitThresholdBelow: 0.997,
  profitThresholdAbove: 1.003,
  tradeAmount: `${envVar('TRADE_AMOUNT', '0.25')}`,
  slippage: '0.01',
  maxDeadline: `${60_000}`,
  nativeToken: Tokens.WMATIC // todo: should be parametrizable on config as chainId
}
