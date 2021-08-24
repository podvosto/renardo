import { ethers } from 'ethers'
import { Contracts } from './Config'
import { ArbitrageTraderABI } from './ABI/ArbitrageTrader'
import { provider } from './Providers'
;(async () => {
  const contract = new ethers.Contract(Contracts.ArbitrageTrader, ArbitrageTraderABI, provider)
  await contract.getMessage().then(console.log)
})()
