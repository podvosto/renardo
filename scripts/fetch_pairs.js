const fetch = require('node-fetch').default
const ethers = require('ethers')
const fs = require('fs')
const { Multicall } = require('ethereum-multicall')

async function fetchUnifiPairs() {
  const rawPairs = await fetch(
    `https://data.unifi.report/api/smart-contract-balances?page_size=999&blockchain=polygon&version=2`
  )
    .then((res) => res.json())
    .then((res) => res.results)

  return rawPairs.map((rawPair) => {
    const WMATICADDR = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
    return {
      name: rawPair.trading_pair,
      address: rawPair.contract_address,
      token0: {
        symbol: rawPair.token_a_address === 'MATIC' ? 'WMATIC' : rawPair.token_a,
        address: rawPair.token_a_address === 'MATIC' ? WMATICADDR : rawPair.token_a_address,
        decimals: Number(undefined)
      },
      token1: {
        symbol: rawPair.token_b_address === 'MATIC' ? 'WMATIC' : rawPair.token_b,
        address: rawPair.token_b_address === 'MATIC' ? WMATICADDR : rawPair.token_b_address,
        decimals: Number(undefined)
      }
    }
  })
}

function fetchPairsFromTheGraph(url) {
  return async () => {
    const rawPairs = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        operationName: 'pairs',
        variables: {
          skip: 0
        },
        query:
          'query pairs($skip: Int!) {\n  pairs(first: 1000, skip: $skip, orderBy: trackedReserveETH, orderDirection: desc) {\n    id\n    token0 {\n      id\n      symbol\n      name\n      __typename\n    }\n    token1 {\n      id\n      symbol\n      name\n      __typename\n    }\n    __typename\n  }\n}\n'
      })
    })
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
}

const fetchQuickswapPairs = fetchPairsFromTheGraph(
  'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06'
)
const fetchPolydexPairs = fetchPairsFromTheGraph(
  'https://api.thegraph.com/subgraphs/name/polydex-ws/polydex-info-v2'
)

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
  const provider = new ethers.providers.StaticJsonRpcProvider(
    'https://rpc-mainnet.maticvigil.com/v1/e7f0574e6b5761ee482f017f4e03c4405e58c7fa',
    137
  )
  const unifi = await fetchUnifiPairs()
  const quickswap = await fetchQuickswapPairs()
  const polydex = await fetchPolydexPairs()
  const pairsByExchange = { unifi, quickswap, polydex }

  const allPairs = [...unifi, ...quickswap, ...polydex]

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
  fs.writeFileSync('./all-pairs.json', json)
}

main()
