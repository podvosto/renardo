import { ethers } from 'ethers'
import { Config } from './Config'

export const provider = new ethers.providers.StaticJsonRpcProvider(
  Config.jsonRpcUrl,
  Config.chainId
)

export const wallet = new ethers.Wallet(Config.privateKey).connect(provider)
