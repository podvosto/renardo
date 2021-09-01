import { ethers } from 'ethers'
import { checkProfitability, ProfitabilityResult } from '../Utils'
import { BN, toHex } from '../../Utils/BigNumber'
import { calcDeadline, gasLimitToFactorized, normalizeSwapRoute } from '../../Utils/Trade'
import { Pair, Token } from '../../Types'
import { PivotArbitrageTraderContract } from '../../Contracts'

type PreTradeResult = ProfitabilityResult & {
  outputAfterTrade: string
  execute: () => Promise<{ hash: string }>
}

const NOT_PROFITABLE_EXECUTE = () => Promise.reject('NOT_PROFITABLE')
export class RouteSwap {
  constructor(public readonly pair: Pair, public path: [Token, Token]) {}
  get name() {
    return `${this.pair.exchange.name}(${this.path[0].symbol}>${this.path[1].symbol})`
  }
  reverse() {
    return new RouteSwap(this.pair, [this.path[1], this.path[0]])
  }
}

export class Route {
  constructor(public readonly route: RouteSwap[]) {}
  get name() {
    return this.route.map((r) => r.name).join(' > ')
  }
  reverse() {
    const route = [...this.route].reverse().map((swap) => swap.reverse())
    return new Route(route)
  }

  async prepareTrade(
    amount: string,
    trader: PivotArbitrageTraderContract
  ): Promise<PreTradeResult> {
    const [firstSwap, pivotSwap, lastSwap] = this.route
    const firstSwapOut = await this.amountsOut(firstSwap, amount)
    const pivotSwapOut = await this.amountsOut(pivotSwap, firstSwapOut)
    const lastSwapOut = await this.amountsOut(lastSwap, pivotSwapOut)

    const tradeParamsFactory = (outputAmount: string) => ({
      deadline: calcDeadline(),
      inputAmount: toHex(firstSwap.path[0].toPrecision(amount)),
      expectedOutputAmount: toHex(outputAmount),
      ex0Path: normalizeSwapRoute(firstSwap.path),
      ex0Router: firstSwap.pair.exchange.router.address,
      ex1Path: normalizeSwapRoute(pivotSwap.path),
      ex1Router: pivotSwap.pair.exchange.router.address,
      ex2Path: normalizeSwapRoute(lastSwap.path),
      ex2Router: lastSwap.pair.exchange.router.address
    })

    const underPricedOutputToCalcGas = BN(amount).multipliedBy(0.9).toFixed(0)
    const gasLimit = await trader.estimateGasForTrade(
      tradeParamsFactory(underPricedOutputToCalcGas)
    )

    const outputAfterTrade = BN(lastSwapOut).minus(gasLimitToFactorized(gasLimit)).toFixed()

    const outputAmout = toHex(lastSwap.path[1].toPrecision(lastSwapOut))
    // check result
    const profitabilityResult = checkProfitability(amount, outputAfterTrade)
    const execute = () => trader.trade(tradeParamsFactory(outputAmout), { gasLimit })

    return {
      execute,
      outputAfterTrade,
      ...profitabilityResult
    }
  }

  async amountsOut(routeSwap: RouteSwap, amount: string): Promise<string> {
    const { pair, path } = routeSwap

    const firstSwapAmountsOutArg = [toHex(path[0].toPrecision(amount)), normalizeSwapRoute(path)]
    const firstSwapAmountsOut: string[] = await pair.exchange.router
      .getAmountsOut(...firstSwapAmountsOutArg)
      .then((res: ethers.BigNumber[]) =>
        res.map((value, key) => path[key].toFactorized(value.toString()))
      )

    return firstSwapAmountsOut.pop()!
  }
}
