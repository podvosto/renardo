import { Pair, Token } from './Types'

export class Route {
  constructor(public readonly swaps: RouteSwap[] = []) {}
}

export class RouteSwap {
  constructor(public readonly pair: Pair, public readonly from: Token, public readonly to: Token) {}
}
