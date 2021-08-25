import { ArbitrageTraderABI } from '../ABI/ArbitrageTrader'

import { ethers } from 'ethers'
import { ContractBase } from './ContractBase'
import { gasLimitToPrecision } from '../Utils'

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

export class ArbitrageTraderContract extends ContractBase {
  constructor(address: string, provider: ethers.Signer | ethers.providers.Provider) {
    super(address, ArbitrageTraderABI, provider)
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

  trade(p: TradeParams, gasLimit: string): Promise<any> {
    const args = [
      p.inputAmount,
      p.expectedOutputAmount,
      p.ex0Router,
      p.ex0Path,
      p.ex1Router,
      p.ex1Path,
      p.deadline
    ]

    return this.contract.trade(...args, { gasLimit })
  }

  async withdrawToken({ tokenAddress, amount }: WithdrawParams): Promise<any> {
    const args = [tokenAddress, amount]

    const gasLimit = gasLimitToPrecision('0.04') /*await this.contract.estimateGas
      .withdrawToken(...args)
      .then((res) => res.toString())
      */

    return this.contract.withdrawToken(...args, { gasLimit })
  }
}
