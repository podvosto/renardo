import { ERC20 } from '../ABI/ERC20'
import { ethers } from 'ethers'
import { Token } from '../Types'
import { BN } from './BigNumber'
import colors from 'colors'

const defaultApprovalValue = BN(2).pow(256).minus(1).toFixed()

interface ApproveParams {
  spender: string
  amount?: string
}

interface AllowanceParams {
  spender: string
  owner: string
}

export const erc20HelperFactory = (
  token: Token,
  provider: ethers.Signer | ethers.providers.Provider
) => {
  const contract = new ethers.Contract(token.address, ERC20, provider)

  const approve = async ({ spender, amount }: ApproveParams) => {
    const approvalValue = amount
      ? BN(token.toPrecision(amount)).decimalPlaces(0).toFixed()
      : defaultApprovalValue

    const gasLimit = await contract.estimateGas.approve(spender, approvalValue)

    return contract
      .approve(spender, approvalValue, {
        callValue: undefined,
        gasLimit
      })
      .then((res: any) => {
        console.log(colors.green(`[Approve] ${token.symbol} (${token.address}) success`))
        return res
      })
      .catch((err: any) => {
        console.error(colors.red(`[Approve] ${token.symbol} (${token.address}) failed`))
        throw err
      })
  }

  const allowance = ({ owner, spender }: AllowanceParams) => {
    return contract.allowance(owner, spender).then((res: ethers.BigNumber) => res.toString())
  }

  const approveIfNeeded = async ({ owner, spender, amount }: AllowanceParams & ApproveParams) => {
    const allowanceValue = await allowance({ owner, spender })

    if (BN(allowanceValue).isZero()) {
      await approve({ spender })
      return true
    }
    return false
  }

  return { approve, allowance, approveIfNeeded }
}
