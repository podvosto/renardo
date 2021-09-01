import { toHex } from '../../Utils/BigNumber'
import { getTokenFromAddress } from '../utils'
import { wallet } from '../../Providers'
import { ethers } from 'ethers'
import { ExecutionResponse } from '../../Contracts/ContractBase'

export const withdraw = (contractAddress: string, amount: string, tokenAddress: string) => {
  const token = getTokenFromAddress(tokenAddress)
  if (!token) {
    throw new Error('Token not supported')
  }
  const contract = new ethers.Contract(
    contractAddress,
    [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address'
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          }
        ],
        name: 'withdrawToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    wallet
  )
  console.log(`[Withdraw] ${amount}${token.symbol}`)

  contract
    .withdrawToken(token.address, toHex(token.toPrecision(amount)))
    .then((res: ExecutionResponse) => {
      console.log(`[Success] https://polygonscan.com/tx/${res.hash}`)
    })
    .catch((error: any) => {
      console.log(`[Failure]`, error)
    })
}
