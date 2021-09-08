import { ethers } from 'ethers'
import { BN } from './Utils/BigNumber'

export type Strategy = 'PIVOT' | 'DIRECT'

export interface InitializedExchange {
  name: string
  router: ethers.Contract
  factory: ethers.Contract
  pairs: Pair[]
}

export interface PairData {
  address: string
  token0: Token
  token1: Token
}
export type ExchangePairsData = Record<string, PairData[]>
export interface ExchangeData {
  name: string
  router: string
  factory: string
}
export class Pair {
  constructor(
    public contract: ethers.Contract,
    public readonly token0: Token,
    public readonly token1: Token,
    public readonly exchange: Exchange
  ) {}
  get name() {
    return `${this.token0.symbol}-${this.token1.symbol}`
  }
  get address() {
    return this.contract.address
  }

  get exists() {
    return parseInt(this.contract.address, 16) !== 0
  }
  get hash() {
    return [this.token0.address.toLowerCase(), this.token1.address.toLowerCase()]
      .sort((a, b) => (a < b ? 1 : -1))
      .join('_')
  }
  contains(find: Token) {
    return this.token0.equals(find) || this.token1.equals(find)
  }
}

export class Exchange {
  public constructor(
    public readonly name: string,
    public readonly router: ethers.Contract,
    public readonly factory: ethers.Contract,
    public pairs: Pair[] = []
  ) {}

  copy() {
    const copiedEx = new Exchange(this.name, this.router, this.factory, [])
    copiedEx.pairs = this.pairs.map(
      (pair) => new Pair(pair.contract, pair.token0, pair.token1, copiedEx)
    )

    return copiedEx
  }
  addPair(pair: Pair) {
    this.pairs.push(pair)
  }
}
export class Token {
  constructor(
    public readonly symbol: string,
    public readonly address: string,
    public readonly decimals: number
  ) {}

  toFactorized(n: string) {
    return BN(n).dividedBy(Math.pow(10, this.decimals)).toFixed()
  }

  toPrecision(n: string) {
    return BN(n).multipliedBy(Math.pow(10, this.decimals)).toFixed()
  }

  equals(token: Token) {
    return token.address.toLowerCase() === this.address.toLowerCase()
  }
}
