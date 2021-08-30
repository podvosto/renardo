import colors from 'colors'
import { Contracts, UnifiExchange, QuickSwapExchange, Tokens } from './Config'

import { wallet } from './Providers'
import { DirectArbitrageTraderContract } from './Contracts'
import { calcDeadline, gasLimitToPrecision } from './Utils/Trade'
import { toHex } from './Utils/BigNumber'

async function gimmeTheMoney(contract: DirectArbitrageTraderContract) {
  contract
    .withdrawToken({
      tokenAddress: Tokens.WMATIC.address,
      amount: toHex(Tokens.WMATIC.toPrecision('0.149'))
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

async function doTheTrade(contract: DirectArbitrageTraderContract) {
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
  const contract = new DirectArbitrageTraderContract(Contracts.DirectArbitrageTrader, wallet)
  gimmeTheMoney(contract)
})()
