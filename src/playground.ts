import { ethers } from 'ethers'
import { Contracts, UnifiExchange, QuickSwapExchange, Tokens } from './Config'

import { wallet } from './Providers'
import { ArbitrageTraderContract } from './Contracts'
import { calcDeadline, toHex } from './Utils'
;(async () => {
  const contract = new ArbitrageTraderContract(Contracts.ArbitrageTrader, wallet)
  const args = {
    ex0Router: UnifiExchange.router,
    ex1Router: QuickSwapExchange.router,
    ex0Path: [Tokens.WMATIC.address, Tokens.USDC.address],
    ex1Path: [Tokens.USDC.address, Tokens.WMATIC.address],
    inputAmount: toHex(Tokens.WMATIC.toPrecision('0.01')),
    // do not limit expeced amoount
    expectedOutputAmount: toHex(Tokens.WMATIC.toPrecision('0.0001')),
    deadline: calcDeadline()
  }
  const gasLimit = await contract.estimateGasForTrade(args)

  contract
    .trade(args, gasLimit)
    .then((res) => {
      debugger
      console.log(res)
    })
    .catch((error) => {
      debugger
      console.log(error)
    })
})()
