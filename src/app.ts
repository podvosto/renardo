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
  calcDeadline
} from './Utils'
import { Pair } from './Types'
import colors from 'colors'
import { provider, wallet } from './Providers'
import { ArbitrageTraderContract } from './Contracts'

const loggerFactory = (block: any) => {
  const logs: any[][] = []
  const log = (...args: any[]) => console.log(...args) //logs.push(args)
  const print = () => {
    const block = logs.reduce(
      (block, line) => `
      ${block}
      ${line.join('\n')}`,
      ''
    )
    console.log(block)
  }
  return { log, print }
}

async function main() {
  const exchanges = Exchanges.map((e) => ({
    name: e.name,
    router: new ethers.Contract(e.router, UniswapRouter02, wallet),
    factory: new ethers.Contract(e.factory, UniswapFactory, wallet),
    pairs: [] as Pair[]
  }))

  for (const pair of Pairs) {
    for (const exc of exchanges) {
      const pairAddress = await exc.factory.getPair(pair.token0.address, pair.token1.address)
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      exc.pairs.push(new Pair(pairContract, pair.token0, pair.token1))
    }
  }

  const arbitrageTrader = new ArbitrageTraderContract(Contracts.ArbitrageTrader, wallet)

  provider.on('block', async (block) => {
    // A forEach doesnt stop on Await, so it's faster
    Pairs.forEach(async (_, i) => {
      const logger = loggerFactory(block)
      logger.log(`\n`)

      const ex0 = exchanges[0]
      const ex1 = exchanges[1]

      const pairEx0 = ex0.pairs[i]
      const pairEx1 = ex1.pairs[i]

      const { token0, token1 } = pairEx0

      if (!pairEx0.exists || !pairEx1.exists) {
        return
      }

      logger.log(colors.magenta(`[${pairEx0.name}]`))
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

        logger.log(
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

        logger.log(
          `[${ex1.name}] 2nd swap: ${midTokenOut} ${midToken.symbol} = ${finalTokenOut} ${finalToken.symbol}`
        )

        /**
         * Calc swaps gas limit
         **/

        const firstAmountIn = fromToken.toPrecision(Trade.tradeAmount)

        const tradeArgs = {
          inputAmount: firstAmountIn,
          expectedOutputAmount: BN(firstAmountIn).multipliedBy(0.8).toFixed(0),
          ex0Router: ex0.router.address,
          ex1Router: ex1.router.address,
          ex0Path: normalizeSwapRoute(route0),
          ex1Path: normalizeSwapRoute(route1),
          deadline: calcDeadline()
        }

        const estimatedGas = await arbitrageTrader.estimateGasForTrade(tradeArgs)
        // final token out include LP fee
        const outputAfterTrade = BN(finalTokenOut).minus(estimatedGas).toFixed()

        tradeArgs.expectedOutputAmount = outputAfterTrade

        // Calc profitability
        const difference = BN(outputAfterTrade).dividedBy(Trade.tradeAmount).toFixed()
        const profitableToSellOnEx1 = BN(difference).isGreaterThan(Trade.profitThresholdAbove)
        const profitableSellOn0Ex0 = BN(difference).isGreaterThan(Trade.profitThresholdBelow)
        if (!profitableToSellOnEx1 && !profitableSellOn0Ex0) {
          logger.log('[Skip Trade] No trading opportunity')
        }
        if (profitableToSellOnEx1 || profitableSellOn0Ex0) {
          // Calc Swap direction
          const buyOn = profitableSellOn0Ex0 ? ex1 : ex0
          const sellOn = profitableSellOn0Ex0 ? ex0 : ex1

          logger.log(
            colors.green(
              `[Trade Opportunity] ${pairEx0.name} Buy on ${buyOn.name} Sell on ${sellOn.name}`
            )
          )

          await arbitrageTrader
            .trade(tradeArgs, { gasLimit: estimatedGas })
            .then((res) => {
              logger.log(
                colors.green('[Tx]'),
                colors.magenta(`https://polygonscan.com/tx/${res.has}`)
              )
              debugger
            })
            .catch((error) => {
              console.error(error)
              debugger
            })
          logger.print()
        }
      } catch (error) {
        console.error(error)
      }
    })
  })
}

main()
