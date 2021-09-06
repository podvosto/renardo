import { provider, wallet } from '../../Providers'
import { UniswapFactory } from '../../ABI/UniswapFactory'
import { UniswapRouter02 } from '../../ABI/UniswapRouter02'
import { ethers } from 'ethers'
import { Exchange, ExchangeData, Pair, PairData, ExchangePairsData } from '../../Types'
import { UniswapPair } from '../../ABI/UniswapPair'
import { mixAllExchangePairs, NOT_FOUND_PAIR_ADDRESS } from '../../Utils/Pair'

export const exchangesInitializer = async (
  exchangesData: ExchangeData[],
  exchangesPairData: ExchangePairsData
): Promise<Exchange[]> => {
  const exchanges: Exchange[] = exchangesData.map(
    (e) =>
      new Exchange(
        e.name,
        new ethers.Contract(e.router, UniswapRouter02, wallet),
        new ethers.Contract(e.factory, UniswapFactory, wallet)
      )
  )
  const pairsData = mixAllExchangePairs(exchangesPairData)

  for (const pairData of pairsData) {
    const pairsFetched = []
    for (const exc of exchanges) {
      const pairAddress = await exc.factory
        .getPair(pairData.token0.address, pairData.token1.address)
        .catch(() => NOT_FOUND_PAIR_ADDRESS)
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      const pair = new Pair(pairContract, pairData.token0, pairData.token1, exc)
      if (pair.exists) {
        pairsFetched.push(pair)
      }
    }
    // only store pairs found in both exchanges
    if (pairsFetched.length === exchanges.length) {
      console.log(`[PairFetch] ${pairsFetched[0].name} successfully added`)
      for (let i = 0; i < pairsFetched.length; i++) {
        exchanges[i].addPair(pairsFetched[i])
      }
    } else {
      console.log(`[PairFetch] ${pairsFetched[0].name} is skipped`)
    }
  }
  return exchanges
}
