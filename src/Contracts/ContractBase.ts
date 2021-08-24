import { ethers } from 'ethers'
import { gasLimitToFactorized } from '../Utils'

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
