import { DirectArbitrageTraderABI } from '../ABI/DirectArbitrageTrader'

import { ethers } from 'ethers'
import { ContractBase, ExecuteOptions, ExecutionResponse } from './ContractBase'
import { ITraderContract, TradeParams, WithdrawParams } from './ITraderContract'
import { normalizeSwapRoute } from '../Utils/Trade'
import { calcDeadline } from '../Utils/Trade'

export class DirectArbitrageTraderContract extends ContractBase implements ITraderContract {
  constructor(address: string, provider: ethers.Signer | ethers.providers.Provider) {
    super(address, DirectArbitrageTraderABI, provider)
  }

  buildTradeArgs({ inputAmount, expectedOutputAmount, route }: TradeParams): any[] {
    const [firstSwap, lastSwap] = route.route
    return [
      route.route[0].path[0].toPrecision(inputAmount),
      route.route[1].path[1].toPrecision(expectedOutputAmount),
      firstSwap.pair.exchange.router.address,
      normalizeSwapRoute(firstSwap.path),
      lastSwap.pair.exchange.router.address,
      normalizeSwapRoute(lastSwap.path),
      calcDeadline()
    ]
  }

  estimateGasForTrade(p: TradeParams): Promise<string> {
    return this.contract.estimateGas.trade(...this.buildTradeArgs(p)).then((res) => res.toString())
  }

  trade(p: TradeParams, opts: ExecuteOptions): Promise<ExecutionResponse> {
    return this.contract.trade(...this.buildTradeArgs(p), opts)
  }

  async withdrawToken({ tokenAddress, amount }: WithdrawParams): Promise<ExecutionResponse> {
    const args = [tokenAddress, amount]

    const gasLimit = await this.contract.estimateGas
      .withdrawToken(...args)
      .then((res) => res.toString())

    return this.contract.withdrawToken(...args, { gasLimit })
  }
}
