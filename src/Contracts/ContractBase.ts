import { ethers } from 'ethers'

export interface ExecuteOptions {
  gasLimit: string
  gasPrice?: string
  nonce?: string
}
export class ContractBase {
  public readonly contract: ethers.Contract
  constructor(
    public readonly address: string,
    public readonly abi: any,
    public readonly provider: ethers.providers.Provider | ethers.Signer
  ) {
    this.contract = new ethers.Contract(address, abi, provider)
  }
}
