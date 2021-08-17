import { ethers } from 'ethers'

export interface Token {
  address: string
  symbol: string
}

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
