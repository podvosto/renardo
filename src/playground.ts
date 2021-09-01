import colors from 'colors'
import { Contracts, UnifiExchange, QuickSwapExchange, Tokens } from './Config'

import { wallet } from './Providers'
import { PivotArbitrageTraderContract } from './Contracts'
import { calcDeadline, gasLimitToPrecision } from './Utils/Trade'
import { toHex } from './Utils/BigNumber'

async function gimmeTheMoney(contract: PivotArbitrageTraderContract) {
  contract
    .withdrawToken({
      tokenAddress: Tokens.WMATIC.address,
      amount: toHex(Tokens.WMATIC.toPrecision('1'))
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

async function doTheTrade(contract: PivotArbitrageTraderContract) {
  const args = {
    ex0Router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    ex1Router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    ex2Router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    ex0Path: [
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      '0x831753dd7087cac61ab5644b308642cc1c33dc13'
    ],
    ex1Path: [
      '0x831753dd7087cac61ab5644b308642cc1c33dc13',
      '0x8465d41d66ce05bde12fd3320f260e01aa4ced3f'
    ],
    ex2Path: [
      '0x8465d41d66ce05bde12fd3320f260e01aa4ced3f',
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
    ],
    inputAmount: toHex(Tokens.WMATIC.toPrecision('0.01')),
    // do not limit expeced amoount
    expectedOutputAmount: toHex(Tokens.WMATIC.toPrecision('0.001')),
    deadline: calcDeadline()
  }

  const gasLimit = await contract.estimateGasForTrade(args)
  const gasPrice = undefined
  const nonce = undefined
  contract
    .trade(args, { gasPrice, gasLimit: toHex(gasLimit), nonce })
    .then((res) => {
      console.log(
        colors.green(`[Success]`),
        colors.magenta(`https://polygonscan.com/tx/${res.hash}`)
      )
    })
    .catch((error) => {
      console.log(error.message)
    })
}

;(async () => {
  const contract = new PivotArbitrageTraderContract(Contracts.PivotArbitrageTrader, wallet)
  gimmeTheMoney(contract)
})()
