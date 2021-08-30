import { envVar } from '../Utils/Misc'

export const Account = {
  privateKey: envVar('WALLET_PRIVATE_KEY')
}
