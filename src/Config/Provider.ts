import { envVar } from '../Utils/Misc'

export const Provider = {
  jsonRpcUrl: envVar('PROVIDER_JSON_RPC_URL'),
  chainId: Number(envVar('CHAIN_ID'))
}
