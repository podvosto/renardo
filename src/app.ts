import { ethers } from 'ethers'
import { UniswapFactory } from './ABI/UniswapFactory'
import { UniswapPair } from './ABI/UniswapPair'
import { UniswapRouter02 } from './ABI/UniswapRouter02'
import { Exchanges, Trade, Pairs, Contracts } from './Config'
import {
  BN,
  toHex,
  calcMinAmount,
  normalizeSwapRoute,
  getPairNativeToken,
  getPairNonNativeToken,
  calcDeadline,
  gasLimitToFactorized,
  NOOP
} from './Utils'
import { Pair, Token } from './Types'
import colors from 'colors'
import { provider, wallet } from './Providers'
import { ERC20Contract, ArbitrageTraderContract } from './Contracts'

async function main() {
  const exchanges = Exchanges.map((e) => ({
    name: e.name,
    router: new ethers.Contract(e.router, UniswapRouter02, wallet),
    factory: new ethers.Contract(e.factory, UniswapFactory, wallet),
    pairs: [] as Pair[]
  }))

  const approvingList: [string, Token][] = []

  for (const pair of Pairs) {
    for (const exc of exchanges) {
      // Add tokens to router approval list
      approvingList.push([exc.router.address, pair.token0])
      approvingList.push([exc.router.address, pair.token1])

      const pairAddress = await exc.factory.getPair(pair.token0.address, pair.token1.address)
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      exc.pairs.push(new Pair(pairContract, pair.token0, pair.token1))
    }
  }

  /**
   * Approve all tokens on routers
   * It could be done on demand but we do not want to lose oportunities waiting for it.
   * And this will happen only once when changing trading account or adding new pairs
   **/

  await Promise.all(
    approvingList.map(([router, token]) =>
      new ERC20Contract(token, wallet)
        .approveIfNeeded({
          owner: wallet.address,
          spender: router
        })
        .then((res) => (res ? res.wait(1) : Promise.resolve()))
        .catch(NOOP)
    )
  )

  const arbitrageTrader = new ArbitrageTraderContract(Contracts.ArbitrageTrader, wallet)

  provider.once('block', async (block) => {
    console.log(colors.cyan(`[Block #${block}]`))
    // A forEach doesnt stop on Await, so it's faster
    //Pairs.forEach(async (_, i) => {
    // wanna debug
    for (let i = 0; i < Pairs.length; i++) {
      console.log(`\n`)

      const ex0 = exchanges[0]
      const ex1 = exchanges[1]

      const pairEx0 = ex0.pairs[i]
      const pairEx1 = ex1.pairs[i]

      const { token0, token1 } = pairEx0

      if (!pairEx0.exists || !pairEx1.exists) {
        return
      }

      console.log(colors.magenta(`[${pairEx0.name}]`))
      try {
        /**
         * Calc swaps amounts out
         */
        // Swap amount out on Exchange0
        const fromToken = getPairNativeToken(pairEx0, Trade.nativeToken)
        const midToken = getPairNonNativeToken(pairEx0, Trade.nativeToken)
        const route0 = [fromToken, midToken]
        const firstSwapAmountsOutArg = [
          toHex(fromToken.toPrecision(Trade.tradeAmount)),
          normalizeSwapRoute(route0)
        ]
        const firstSwapAmountsOut: string[] = await ex0.router
          .getAmountsOut(...firstSwapAmountsOutArg, {
            callValue: undefined
          })
          .then((res: ethers.BigNumber[]) =>
            res.map((value, key) => route0[key].toFactorized(value.toString()))
          )

        const midTokenOut = firstSwapAmountsOut.pop()!

        console.log(
          `[${ex0.name}] 1st swap: ${Trade.tradeAmount} ${fromToken.symbol} = ${midTokenOut} ${route0[1].symbol}`
        )

        // Swap amount out on Exchange1
        const finalToken = fromToken
        const route1 = [midToken, finalToken]
        const secondSwapAmountsOutArg = [
          toHex(midToken.toPrecision(midTokenOut)),
          normalizeSwapRoute(route1)
        ]
        const secondSwapAmountsOut: string[] = await ex0.router
          .getAmountsOut(...secondSwapAmountsOutArg, {
            callValue: undefined
          })
          .then((res: ethers.BigNumber[]) =>
            res.map((value, key) => route1[key].toFactorized(value.toString()))
          )

        const finalTokenOut = secondSwapAmountsOut.pop()!

        console.log(
          `[${ex1.name}] 2nd swap: ${midTokenOut} ${midToken.symbol} = ${finalTokenOut} ${finalToken.symbol}`
        )

        /**
         * Calc swaps gas limit
         **/
        const deadline = calcDeadline()

        const firstAmountIn = fromToken.toPrecision(Trade.tradeAmount)
        const firstAmountOutMin = calcMinAmount(
          midToken.toPrecision(midTokenOut),
          Trade.slippage,
          0
        )

        // we do not need to calc exact args for second swap as this is just for estimation
        const swapParamsToEstimate = [
          toHex(firstAmountIn),
          toHex(firstAmountOutMin),
          normalizeSwapRoute(route0),
          wallet.address,
          deadline
        ]

        const [gasLimitEx0, gasLimitEx1] = await Promise.all(
          [ex0, ex1].map((ex) =>
            ex.router.estimateGas
              .swapExactTokensForTokens(...swapParamsToEstimate, {
                callValue: undefined
              })
              .then((gasLimit) => gasLimitToFactorized(gasLimit.toString()))
          )
        )
        const estimatedGas = BN(gasLimitEx0).plus(gasLimitEx1).toFixed()
        // final token out include LP fee
        const outputAfterTrade = BN(finalTokenOut).minus(estimatedGas).toFixed()

        const tradeArgs = {
          inputAmount: firstAmountIn,
          expectedOutputAmount: toHex(fromToken.toPrecision(outputAfterTrade)),
          ex0Router: ex0.router.address,
          ex1Router: ex1.router.address,
          ex0Path: normalizeSwapRoute(route0),
          ex1Path: normalizeSwapRoute(route1),
          deadline: calcDeadline()
        }
        const arbitrageGas = await arbitrageTrader.estimateGasForTrade(tradeArgs)

        const outputAfterTradeAndCall = BN(outputAfterTrade).minus(
          gasLimitToFactorized(arbitrageGas)
        )
        // Calc profitability
        const difference = BN(outputAfterTradeAndCall).dividedBy(Trade.tradeAmount).toFixed()
        const profitableToSellOnEx1 = BN(difference).isGreaterThan(Trade.profitThresholdAbove)
        const profitableSellOn0Ex0 = BN(difference).isGreaterThan(Trade.profitThresholdBelow)
        if (!profitableToSellOnEx1 && !profitableSellOn0Ex0) {
          console.log('[Skip Trade] No trading opportunity')
        }
        if (profitableToSellOnEx1 || profitableSellOn0Ex0) {
          // Calc Swap direction
          const buyOn = profitableSellOn0Ex0 ? ex1 : ex0
          const sellOn = profitableSellOn0Ex0 ? ex0 : ex1

          console.log(
            colors.green(
              `[Trade Opportunity] ${pairEx0.name} Buy on ${buyOn.name} Sell on ${sellOn.name}`
            )
          )
/* not ready 
          arbitrageTrader
            .trade(tradeArgs, arbitrageGas)
            .then((res) => {
              console.log(res)
              debugger
            })
            .catch((error) => {
              console.error(error)
              debugger
            })
        }
      } catch (error) {
        console.error(error)
      }
      */
    }
    //})
  })
}

main()
