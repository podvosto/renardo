import { PivotArbitrageTraderABI } from '../ABI/PivotArbitrageTrader'

import { ethers } from 'ethers'
import { ContractBase, ExecuteOptions, ExecutionResponse } from './ContractBase'
import { normalizeSwapRoute } from '../Utils/Trade'
import { calcDeadline } from '../Utils/Trade'
import { ITraderContract, TradeParams, WithdrawParams } from './ITraderContract'

export class PivotArbitrageTraderContract extends ContractBase implements ITraderContract {
  constructor(address: string, provider: ethers.Signer | ethers.providers.Provider) {
    super(address, PivotArbitrageTraderABI, provider)
  }

  buildTradeArgs({ inputAmount, expectedOutputAmount, route }: TradeParams): any[] {
    const [firstSwap, pivotSwap, lastSwap] = route.route
    return [
      route.route[0].path[0].toPrecision(inputAmount),
      route.route[2].path[1].toPrecision(expectedOutputAmount),
      firstSwap.pair.exchange.router.address,
      normalizeSwapRoute(firstSwap.path),
      pivotSwap.pair.exchange.router.address,
      normalizeSwapRoute(pivotSwap.path),
      lastSwap.pair.exchange.router.address,
      normalizeSwapRoute(lastSwap.path),
      calcDeadline()
    ]
  }

  estimateGasForTrade(params: TradeParams): Promise<string> {
    return this.contract.estimateGas
      .trade(...this.buildTradeArgs(params))
      .then((res) => res.toString())
  }

  trade(params: TradeParams, opts: ExecuteOptions): Promise<ExecutionResponse> {
    return this.contract.trade(...this.buildTradeArgs(params), opts)
  }

  async withdrawToken({ tokenAddress, amount }: WithdrawParams): Promise<any> {
    const args = [tokenAddress, amount]

    const gasLimit = await this.contract.estimateGas
      .withdrawToken(...args)
      .then((res) => res.toString())

    return this.contract.withdrawToken(...args, { gasLimit })
  }
}
