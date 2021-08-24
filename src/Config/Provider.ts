import { envVar } from '../Utils'

export const Provider = {
  jsonRpcUrl: 'https://rpc-mainnet.maticvigil.com/v1/e7f0574e6b5761ee482f017f4e03c4405e58c7fa',
  chainId: envVar('CHAIN_ID', 137)
}
