export const Tokens = {
  WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
}

export const Config = {
  exchanges: [
    {
      router: '0x03105929e82B1b8Fb6Eb76266CBd14C16a19D1f2', // Unifi
      factory: '0x4FEE52912f81B78C3CdcB723728926ED6a893D27'
    },
    {
      router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', //QuickSwap
      factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'
    }
  ],
  pairs: [
    {
      token0: Tokens.WETH,
      token1: Tokens.WMATIC
    },
    {
      token0: Tokens.USDT,
      token1: Tokens.WMATIC
    },
    {
      token0: Tokens.WBTC,
      token1: Tokens.WMATIC
    }
  ]
}
