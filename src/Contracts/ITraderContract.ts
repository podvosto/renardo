import { Route } from '../Route'
import { ExecuteOptions, ExecutionResponse } from './ContractBase'

export interface TradeParams {
  inputAmount: string
  expectedOutputAmount: string
  route: Route
}

export interface WithdrawParams {
  tokenAddress: string
  amount: string
}

export interface ITraderContract {
  estimateGasForTrade(params: TradeParams): Promise<string>
  trade(params: TradeParams, opts: ExecuteOptions): Promise<ExecutionResponse>
  withdrawToken({ tokenAddress, amount }: WithdrawParams): Promise<any>
}
