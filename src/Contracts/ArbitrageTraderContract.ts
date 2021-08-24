import { ArbitrageTraderABI } from '../ABI/ArbitrageTrader'

import { ethers } from 'ethers'
import { ContractBase } from './ContractBase'

interface TradeParams {
  inputAmount: string
  expectedOutputAmount: string
  ex0Router: string
  ex0Path: string[]
  ex1Router: string
  ex1Path: string[]
  deadline: string
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

    return this.contract.estimateGas.trade(args).then((res) => res.toString())
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

    return this.contract.trade(args, { gasLimit })
  }
}
