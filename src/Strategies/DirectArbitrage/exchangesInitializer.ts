import { provider, wallet } from '../../Providers'
import { UniswapFactory } from '../../ABI/UniswapFactory'
import { UniswapRouter02 } from '../../ABI/UniswapRouter02'
import { ethers } from 'ethers'
import { ExchangeData, InitializedExchange, Pair, PairData } from '../../Types'
import { UniswapPair } from '../../ABI/UniswapPair'

export const exchangesInitializer = async (
  exchangesData: ExchangeData[],
  pairsData: PairData[]
): Promise<InitializedExchange[]> => {
  const exchanges: InitializedExchange[] = exchangesData.map((e) => ({
    name: e.name,
    router: new ethers.Contract(e.router, UniswapRouter02, wallet),
    factory: new ethers.Contract(e.factory, UniswapFactory, wallet),
    pairs: [] as Pair[]
  }))

  for (const pairData of pairsData) {
    const pairsFetched = []
    for (const exc of exchanges) {
      const pairAddress = await exc.factory
        .getPair(pairData.token0.address, pairData.token1.address)
        .catch((error: any) => {
          debugger
          return '0x0'
        })
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      const pair = new Pair(pairContract, pairData.token0, pairData.token1)
      if (pair.exists) {
        pairsFetched.push(pair)
      }
    }
    // only store pairs found in both exchanges
    if (pairsFetched.length === exchanges.length) {
      console.log(`[PairFetch] ${pairsFetched[0].name} successfully added`)
      for (let i = 0; i < pairsFetched.length; i++) {
        exchanges[i].pairs.push(pairsFetched[i])
      }
    } else {
      console.log(`[PairFetch] ${pairsFetched[0].name} is skipped`)
    }
  }
  return exchanges
}
