import { ethers } from 'ethers'
import { Account, Trade } from './Config'

export const provider = new ethers.providers.StaticJsonRpcProvider(Trade.jsonRpcUrl, Trade.chainId)

export const wallet = new ethers.Wallet(Account.privateKey).connect(provider)
