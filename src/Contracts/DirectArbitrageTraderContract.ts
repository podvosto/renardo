import { DirectArbitrageTraderABI } from '../ABI/DirectArbitrageTrader'

import { ethers } from 'ethers'
import { ContractBase, ExecuteOptions, ExecutionResponse } from './ContractBase'

interface TradeParams {
  inputAmount: string
  expectedOutputAmount: string
  ex0Router: string
  ex0Path: string[]
  ex1Router: string
  ex1Path: string[]
  deadline: string
}

interface WithdrawParams {
  tokenAddress: string
  amount: string
}

export class DirectArbitrageTraderContract extends ContractBase {
  constructor(address: string, provider: ethers.Signer | ethers.providers.Provider) {
    super(address, DirectArbitrageTraderABI, provider)
  }

  estimateGasForTrade(p: TradeParams): Promise<string> {
    const args = [
      p.inputAmount,
      p.expectedOutputAmount,
      p.ex0Router,
      p.ex0Path,
      p.ex1Router,
      p.ex1Path,
      p.deadline
    ]

    return this.contract.estimateGas.trade(...args).then((res) => res.toString())
  }

  trade(p: TradeParams, opts: ExecuteOptions): Promise<ExecutionResponse> {
    const args = [
      p.inputAmount,
      p.expectedOutputAmount,
      p.ex0Router,
      p.ex0Path,
      p.ex1Router,
      p.ex1Path,
      p.deadline
    ]

    return this.contract.trade(...args, opts)
  }

  async withdrawToken({ tokenAddress, amount }: WithdrawParams): Promise<ExecutionResponse> {
    const args = [tokenAddress, amount]

    const gasLimit = await this.contract.estimateGas
      .withdrawToken(...args)
      .then((res) => res.toString())

    return this.contract.withdrawToken(...args, { gasLimit })
  }
}
