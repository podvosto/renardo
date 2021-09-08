import { Pair, Token } from './Types'

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
}
