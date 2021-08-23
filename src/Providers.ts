import { ethers } from 'ethers'
import { Account } from './Config'

export const provider = new ethers.providers.StaticJsonRpcProvider(
  'https://polygon-mainnet.g.alchemy.com/v2/fD5HjNcSOLvLdY1-Os1sPs9iGmrrpO4A',
  137
)

export const wallet = new ethers.Wallet(Account.privateKey).connect(provider)
