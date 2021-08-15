import { ethers } from 'ethers'
import { UniswapFactory } from './ABI/UniswapFactory'
import { UniswapPair } from './ABI/UniswapPair'
import { UniswapRouter02 } from './ABI/UniswapRouter02'
import { Config } from './config'
import { BN } from './Utils/BigNumber'

const provider = new ethers.providers.StaticJsonRpcProvider(
  'https://polygon-mainnet.g.alchemy.com/v2/fD5HjNcSOLvLdY1-Os1sPs9iGmrrpO4A',
  137
)

const PROFIT_THRESHOLD_BELOW = 0.997
const PROFIT_THRESHOLD_ABOVE = 1.003

async function main() {
  const exchanges = Config.exchanges.map((e) => ({
    router: new ethers.Contract(e.router, UniswapRouter02, provider),
    factory: new ethers.Contract(e.factory, UniswapFactory, provider),
    pairs: [] as ethers.Contract[]
  }))

  for (const pair of Config.pairs) {
    for (const exc of exchanges) {
      const pairAddress = await exc.factory.getPair(pair.token0, pair.token1)
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      exc.pairs.push(pairContract)
    }
  }

  provider.on('block', async (b) => {
    console.info('🚀 ~ file: app.ts ~ line 26 ~ provider.on ~ b', b)

    // get reserves on Exchange0
    const rawReservesPair0 = await exchanges[0].pairs[0].getReserves()
    const reserves00 = rawReservesPair0[0].toString()
    const reserves01 = rawReservesPair0[1].toString()
    const price0 = BN(reserves00).div(reserves01).toFixed()
    console.log('🚀 ~ file: app.ts ~ line 34 ~ provider.on ~ reserves0', reserves00, reserves01)
    console.log('🚀 ~ file: app.ts ~ line 34 ~ provider.on ~ reserves0', price0)

    // get reserves on Exchange1
    const rawReservesPair1 = await exchanges[1].pairs[0].getReserves()
    const reserves10 = rawReservesPair1[0].toString()
    const reserves11 = rawReservesPair1[1].toString()
    const price1 = BN(reserves10).div(reserves11).toFixed()
    console.log('🚀 ~ file: app.ts ~ line 34 ~ provider.on ~ reserves1', reserves10, reserves11)
    console.log('🚀 ~ file: app.ts ~ line 34 ~ provider.on ~ reserves1', price1)

    const diference = BN(price1).div(price0).toFixed()
    console.warn('--- Diference', diference)
    if (
      BN(diference).isGreaterThan(PROFIT_THRESHOLD_ABOVE) ||
      BN(diference).isLessThan(PROFIT_THRESHOLD_BELOW)
    ) {
      // Calc Swap direction
      console.warn('---- TRADE OPPORTUNITY')
    }
  })
}

main()
