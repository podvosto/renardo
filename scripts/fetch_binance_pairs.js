const fetch = require('node-fetch').default
const ethers = require('ethers')
const fs = require('fs')
const { Multicall } = require('ethereum-multicall')

async function fetchUnifiPairs() {
  const rawPairs = await fetch(
    `https://data.unifi.report/api/smart-contract-balances?page_size=999&blockchain=binance&version=2`
  )
    .then((res) => res.json())
    .then((res) => res.results)

  return rawPairs.map((rawPair) => {
    const WBNBADDR = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    return {
      name: rawPair.trading_pair,
      address: rawPair.contract_address,
      token0: {
        symbol: rawPair.token_a_address === 'BNB' ? 'WBNB' : rawPair.token_a,
        address: rawPair.token_a_address === 'BNB' ? WBNBADDR : rawPair.token_a_address,
        decimals: Number(undefined)
      },
      token1: {
        symbol: rawPair.token_b_address === 'BNB' ? 'WBNB' : rawPair.token_b,
        address: rawPair.token_b_address === 'BNB' ? WBNBADDR : rawPair.token_b_address,
        decimals: Number(undefined)
      }
    }
  })
}

async function fetchPCSPairs() {
  const rawPairs = await fetch(
    'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2',
    {
      method: 'POST',
      body: JSON.stringify({
        query: `
      query pools {
        pairs: pairs(first: 1000, orderBy: trackedReserveBNB, orderDirection: desc) {
          id
          token0 {
            id
            symbol
            name
          }
          token1 {
            id
            symbol
            name
          }
        }
      }
      
      `
      })
    }
  )
    .then((res) => res.json())
    .then((res) => res.data.pairs)

  return rawPairs.map((rawPair) => ({
    name: `${rawPair.token0.symbol}-${rawPair.token1.symbol}`,
    address: rawPair.id,
    token0: {
      symbol: rawPair.token0.symbol,
      address: rawPair.token0.id,
      decimals: Number(rawPair.token0.decimals)
    },
    token1: {
      symbol: rawPair.token1.symbol,
      address: rawPair.token1.id,
      decimals: Number(rawPair.token1.decimals)
    }
  }))
}

function getTokenDecimalsFactory(provider, batchSize = 30) {
  const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true })

  return async (map) => {
    console.log(`[Decimals] Fetching  ${Object.keys(map).length} tokens in batchs of ${batchSize}`)
    let batch = []
    const promises = []
    for (const tokenAddress of Object.keys(map)) {
      batch.push(tokenAddress)
      if (batch.length >= batchSize) {
        console.log(`Fetching decimals batch of ${batchSize} tokens`)
        const batchCall = multicall.call(
          batch.map((tokenAddress) => ({
            reference: tokenAddress,
            contractAddress: tokenAddress,
            abi: [
              {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [
                  {
                    name: '',
                    type: 'uint8'
                  }
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function'
              }
            ],
            calls: [{ reference: 'decimals', methodName: 'decimals', methodParameters: [] }]
          }))
        )
        promises.push(batchCall)
        batch = []
      }
    }
    const responses = await Promise.all(promises)
    responses.forEach((response) => {
      Object.keys(response.results).forEach((tokenAddress) => {
        const returnCtx = response.results[tokenAddress].callsReturnContext[0]
        if (returnCtx.success) {
          map[tokenAddress] = returnCtx.returnValues[0]
        }
      })
    })

    return map
  }
}

async function main() {
  const provider = new ethers.providers.StaticJsonRpcProvider('http://188.166.110.206:8545', 56)
  const unifi = await fetchUnifiPairs()
  const pancake = await fetchPCSPairs()

  const pairsByExchange = { unifi, pancake }

  const allPairs = [...unifi, ...pancake]

  const tokenToDecimalsMap = allPairs.reduce((map, pair) => {
    map[pair.token0.address] = undefined
    map[pair.token1.address] = undefined
    return map
  }, {})

  const tokenDecimals = await getTokenDecimalsFactory(provider)(tokenToDecimalsMap)
  allPairs.forEach((pair) => {
    pair.token0.decimals = tokenDecimals[pair.token0.address]
    pair.token1.decimals = tokenDecimals[pair.token1.address]
  })

  const json = JSON.stringify(pairsByExchange, null, 4)
  fs.writeFileSync(`./data/binance/pairs.json`, json)
}

main()
