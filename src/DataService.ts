import { Config } from './Config'
import { readFileSync, writeFile } from 'fs'
import { Token, ExchangeData, PairData, Exchange, Pair } from './Types'
import { ethers } from 'ethers'
import { UniswapRouter02 } from './ABI/UniswapRouter02'
import { UniswapFactory } from './ABI/UniswapFactory'
import { UniswapPair } from './ABI/UniswapPair'
import { provider, wallet } from './Providers'

const dataPath = `./data/${Config.blockchain}`

const blacklistPersistencePath = `${dataPath}/blacklisted_pairs.json`
export const BlacklistedPairs: Record<string, string> = JSON.parse(
  readFileSync(blacklistPersistencePath).toString()
)

export const ExchangesData: ExchangeData[] = JSON.parse(
  readFileSync(`${dataPath}/exchanges.json`).toString()
)

export const PairsByExchange: Record<string, PairData[]> = JSON.parse(
  readFileSync(`${dataPath}/pairs.json`).toString()
)

export const Exchanges: Exchange[] = ExchangesData.map((e) => {
  const exchange = new Exchange(
    e.name,
    new ethers.Contract(e.router, UniswapRouter02, wallet),
    new ethers.Contract(e.factory, UniswapFactory, wallet)
  )
  const pairsData = PairsByExchange[exchange.name]

  for (const pairDataRaw of pairsData) {
    const pairContract = new ethers.Contract(pairDataRaw.address, UniswapPair, provider)
    const token0 = new Token(
      pairDataRaw.token0.symbol,
      pairDataRaw.token0.address,
      pairDataRaw.token0.decimals
    )
    const token1 = new Token(
      pairDataRaw.token1.symbol,
      pairDataRaw.token1.address,
      pairDataRaw.token1.decimals
    )

    exchange.addPair(new Pair(pairContract, token0, token1, exchange))
  }

  return exchange
})

export const Tokens: Token[] = []

export const blackList = async (_pairAddress: string, name: string) => {
  const pairAddress = _pairAddress.toLowerCase()
  BlacklistedPairs[pairAddress] = name
  console.log(`[Blacklist] added ${name} at ${pairAddress}`)
  writeFile(blacklistPersistencePath, JSON.stringify(BlacklistedPairs), () => {
    console.log('[Blacklist] persisted')
  })
}

export const isBlackListed = (pairAddesss: string) => {
  return Object.keys(BlacklistedPairs).includes(pairAddesss.toLowerCase())
}

console.log(
  `[Exchanges] Loaded ${Exchanges.map((e) => `${e.name}(${e.pairs.length} pairs)`).join(', ')}`
)
console.log(`[Blacklist] Loaded ${Object.keys(BlacklistedPairs).length} pairs from storage`)
