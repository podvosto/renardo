import { ethers } from 'ethers'
import { Account, Provider } from './Config'

export const provider = new ethers.providers.StaticJsonRpcProvider(
  Provider.jsonRpcUrl,
  Provider.chainId
)

export const wallet = new ethers.Wallet(Account.privateKey).connect(provider)
