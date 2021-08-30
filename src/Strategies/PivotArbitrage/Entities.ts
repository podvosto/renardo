import { ethers } from 'ethers'
import { checkProfitability } from '../Utils'
import { toHex } from '../../Utils/BigNumber'
import { normalizeSwapRoute } from '../../Utils/Trade'
import { Pair, Token } from '../../Types'

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

  async trade(amount: string) {
    const [firstSwap, pivotSwap, lastSwap] = this.route
    const firstSwapOut = await this.amountsOut(firstSwap, amount)
    const pivotSwapOut = await this.amountsOut(pivotSwap, firstSwapOut)
    const lastSwapOut = await this.amountsOut(lastSwap, pivotSwapOut)

    // todo calc SC gas
    const outputAfterTrade = lastSwapOut

    // check result
    const profitabilityResult = checkProfitability(amount, outputAfterTrade)

    return {
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
