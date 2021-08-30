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
  token0: Token
  token1: Token
}
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
  contains(find: Token) {
    return this.token0.equals(find) || this.token1.equals(find)
  }
}

export class Exchange {
  public readonly pairs: Pair[] = []
  public constructor(
    public readonly name: string,
    public readonly router: ethers.Contract,
    public readonly factory: ethers.Contract
  ) {}

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
