import { ethers } from 'ethers'
import { BN } from './Utils/BigNumber'

export class Pair {
  constructor(
    public contract: ethers.Contract,
    public readonly token0: Token,
    public readonly token1: Token
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
}
