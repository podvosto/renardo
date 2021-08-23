import { envVar } from '../Utils'

export const Account = {
  privateKey: envVar('WALLET_PRIVATE_KEY')
}
