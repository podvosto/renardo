import { envVar } from '../Utils/Misc'
import { Tokens } from './Tokens'

export const Trade = {
  profitThresholdBelow: 0.995,
  profitThresholdAbove: 1.005,
  tradeAmount: `${envVar('TRADE_AMOUNT')}`,
  slippage: '0.01',
  maxDeadline: `${60_000}`,
  nativeToken: Tokens.WMATIC // todo: should be parametrizable on config as chainId
}
