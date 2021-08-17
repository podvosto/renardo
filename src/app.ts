import { ethers } from 'ethers'
import { UniswapFactory } from './ABI/UniswapFactory'
import { UniswapPair } from './ABI/UniswapPair'
import { UniswapRouter02 } from './ABI/UniswapRouter02'
import { Exchanges, Tokens, Pairs } from './config'
import { BN, toHex } from './Utils/BigNumber'
import { Pair } from './Types'
import colors from 'colors'
import { ERC20 } from './ABI/ERC20'

const provider = new ethers.providers.StaticJsonRpcProvider(
  'https://polygon-mainnet.g.alchemy.com/v2/fD5HjNcSOLvLdY1-Os1sPs9iGmrrpO4A',
  137
)

const walletAddress = '0x52856Ca4ddb55A1420950857C7882cFC8E02281C'

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
      console.log(`\n`)

      try {
        const ex0 = exchanges[0]
        const ex1 = exchanges[1]

        const pairEx0 = ex0.pairs[i]
        const pairEx1 = ex1.pairs[i]

        const token0 = pairEx0.token0
        const token1 = pairEx0.token1
        if (!pairEx0.exists || !pairEx1.exists) {
          return
        }

        console.log(colors.magenta(`[${pairEx0.name}]`))
        // get reserves on both exchanges
        const [rawReservesPair0, rawReservesPair1] = await Promise.all([
          pairEx0.contract.getReserves(),
          pairEx1.contract.getReserves()
        ])
        // calc price on Exchange0

        const reserves00 = rawReservesPair0[0].toString()
        const reserves01 = rawReservesPair0[1].toString()
        const price0 = BN(reserves00).div(reserves01).toFixed()
        console.log(`[${ex0.name}] Reserves`, reserves00, reserves01)
        console.log(`[${ex0.name}] Price`, price0)

        // calc price on Exchange1

        const reserves10 = rawReservesPair1[0].toString()
        const reserves11 = rawReservesPair1[1].toString()
        const price1 = BN(reserves10).div(reserves11).toFixed()
        console.log(`[${ex1.name}] Reserves`, reserves10, reserves11)
        console.log(`[${ex1.name}] Price`, price1)

        const difference = BN(price1).div(price0).toFixed()
        console.log('[Difference]', difference)

        const profitableToSellOnEx1 = BN(difference).isGreaterThan(PROFIT_THRESHOLD_ABOVE)
        const profitableSellOn0Ex0 = BN(difference).isGreaterThan(PROFIT_THRESHOLD_BELOW)
        if (profitableToSellOnEx1 || profitableSellOn0Ex0) {
          // Calc Swap direction
          const buyOn = profitableSellOn0Ex0 ? ex1 : ex0
          const sellOn = profitableSellOn0Ex0 ? ex0 : ex1

          console.log(
            colors.green(
              `[Trade Opportunity] ${pairEx0.name} Buy on ${buyOn.name} Sell on ${sellOn.name}`
            )
          )
          // Swap params
          const amountIn = toHex(pairEx0.token0.toPrecision('100'))
          const amountOutMin = toHex(
            BN(pairEx0.token0.toPrecision('100')).multipliedBy(1.001).toFixed(0)
          )
          const route = [pairEx0.token0.address, pairEx0.token1.address]
          const deadline = toHex(
            BN(Date.now() + 60_000)
              .dividedBy(1000)
              .toFixed(0)
          )
          const swapParams = [amountIn, amountOutMin, walletAddress, route, deadline]

          // calc gas cost
          const [gasLimitEx0, gasLimitEx1] = await Promise.all([
            ex0.router.estimateGas.swapExactTokensForTokens(...swapParams, {
              callValue: undefined
            }),
            ex1.router.estimateGas.swapExactTokensForTokens(...swapParams, {
              callValue: undefined
            })
          ])
          console.log('GasLimits', gasLimitEx0, gasLimitEx1)
        }
      } catch (error) {
        console.error(error)
      }
    }
    //})
  })
}

main()
