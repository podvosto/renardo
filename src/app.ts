import { ethers } from 'ethers'
import { UniswapFactory } from './ABI/UniswapFactory'
import { UniswapPair } from './ABI/UniswapPair'
import { UniswapRouter02 } from './ABI/UniswapRouter02'
import { Exchanges, Tokens, Pairs } from './config'
import { BN } from './Utils/BigNumber'
import { Pair } from './Types'

const provider = new ethers.providers.StaticJsonRpcProvider(
  'https://polygon-mainnet.g.alchemy.com/v2/fD5HjNcSOLvLdY1-Os1sPs9iGmrrpO4A',
  137
)

const PROFIT_THRESHOLD_BELOW = 0.997
const PROFIT_THRESHOLD_ABOVE = 1.003

async function main() {
  const exchanges = Exchanges.map((e) => ({
    name: e.name,
    router: new ethers.Contract(e.router, UniswapRouter02, provider),
    factory: new ethers.Contract(e.factory, UniswapFactory, provider),
    pairs: [] as Pair[]
  }))

  for (const pair of Pairs) {
    for (const exc of exchanges) {
      const pairAddress = await exc.factory.getPair(pair.token0.address, pair.token1.address)
      const pairContract = new ethers.Contract(pairAddress, UniswapPair, provider)
      exc.pairs.push(new Pair(pairContract, pair.token0, pair.token1))
    }
  }

  provider.on('block', async (b) => {
    console.info('🚀 ~ file: app.ts ~ line 26 ~ provider.on ~ b', b)

    // A forEach doesnt stop on Await, so it's faster
    //Pairs.forEach(async (_, i) => {
    // wanna debug
    for (let i = 0; i < Pairs.length; i++) {
      try {
        const ex0 = exchanges[0]
        const pairEx0 = ex0.pairs[i]
        const ex1 = exchanges[1]
        const pairEx1 = ex1.pairs[i]
        if (!pairEx0.exists || !pairEx1.exists) {
          return
        }

        console.warn('Processing pair: ', pairEx0.name)
        // get reserves on Exchange0
        const rawReservesPair0 = await pairEx0.contract.getReserves()
        const reserves00 = rawReservesPair0[0].toString()
        const reserves01 = rawReservesPair0[1].toString()
        const price0 = BN(reserves00).div(reserves01).toFixed()
        console.log(`[${ex0.name}] Reserves`, reserves00, reserves01)
        console.log(`[${ex0.name}] Price`, price0)
        console.log(`\n`)

        // get reserves on Exchange1
        const rawReservesPair1 = await pairEx1.contract.getReserves()
        const reserves10 = rawReservesPair1[0].toString()
        const reserves11 = rawReservesPair1[1].toString()
        const price1 = BN(reserves10).div(reserves11).toFixed()
        console.log(`[${ex1.name}] Reserves`, reserves10, reserves11)
        console.log(`[${ex1.name}] Price`, price1)
        console.log(`\n`)

        const difference = BN(price1).div(price0).toFixed()
        console.log('Difference:', difference)
        if (
          BN(difference).isGreaterThan(PROFIT_THRESHOLD_ABOVE) ||
          BN(difference).isLessThan(PROFIT_THRESHOLD_BELOW)
        ) {
          // Calc Swap direction
          console.warn('---- TRADE OPPORTUNITY', JSON.stringify(Pairs[i], null, 4))
        }
      } catch (error) {
        console.error(error)
      }
    }
    //})
  })
}

main()
