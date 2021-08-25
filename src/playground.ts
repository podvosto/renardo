import { ethers } from 'ethers'
import { Contracts, UnifiExchange, QuickSwapExchange, Tokens } from './Config'

import { wallet } from './Providers'
import { ArbitrageTraderContract } from './Contracts'
import { calcDeadline, gasLimitToPrecision, toHex } from './Utils'

async function gimmeTheMoney(contract: ArbitrageTraderContract) {
  contract
    .withdrawToken({
      tokenAddress: Tokens.WMATIC.address,
      amount: toHex(Tokens.WMATIC.toPrecision('0.3'))
    })
    .then((res) => {
      console.log(res)
      debugger
    })
    .catch((error) => {
      debugger
      console.log(error)
    })
}

async function doTheTrade(contract: ArbitrageTraderContract) {
  const balance = '300000000000000000'
  const args = {
    ex0Router: UnifiExchange.router,
    ex1Router: QuickSwapExchange.router,
    ex0Path: [Tokens.WMATIC.address, Tokens.USDC.address],
    ex1Path: [Tokens.USDC.address, Tokens.WMATIC.address],
    inputAmount: toHex(Tokens.WMATIC.toPrecision('0.01')),
    // do not limit expeced amoount
    expectedOutputAmount: toHex(Tokens.WMATIC.toPrecision('0.001')),
    deadline: calcDeadline()
  }

  const gasLimit = gasLimitToPrecision('0.01') //await contract.estimateGasForTrade(args)
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
}

;(async () => {
  const contract = new ArbitrageTraderContract(Contracts.ArbitrageTrader, wallet)
  doTheTrade(contract)
})()
