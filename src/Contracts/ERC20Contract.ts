import colors from 'colors'
import { ethers } from 'ethers'
import { ERC20 } from '../ABI/ERC20'
import { Token } from '../Types'
import { BN } from '../Utils'
import { ContractBase } from './ContractBase'

const defaultApprovalValue = BN(2).pow(256).minus(1).toFixed()

interface ApproveParams {
  spender: string
  amount?: string
}

interface AllowanceParams {
  spender: string
  owner: string
}

export class ERC20Contract extends ContractBase {
  constructor(public readonly token: Token, provider: ethers.Signer | ethers.providers.Provider) {
    super(token.address, ERC20, provider)
  }
  async approve({ spender, amount }: ApproveParams) {
    const approvalValue = amount
      ? BN(this.token.toPrecision(amount)).decimalPlaces(0).toFixed()
      : defaultApprovalValue

    const gasLimit = await this.contract.estimateGas.approve(spender, approvalValue)

    return this.contract
      .approve(spender, approvalValue, {
        callValue: undefined,
        gasLimit
      })
      .then((res: any) => {
        console.log(colors.green(`[Approve] ${this.token.symbol} (${this.token.address}) success`))
        return res
      })
      .catch((err: any) => {
        console.error(colors.red(`[Approve] ${this.token.symbol} (${this.token.address}) failed`))
        throw err
      })
  }

  allowance({ owner, spender }: AllowanceParams) {
    return this.contract.allowance(owner, spender).then((res: ethers.BigNumber) => res.toString())
  }

  async approveIfNeeded({ owner, spender, amount }: AllowanceParams & ApproveParams) {
    const allowanceValue = await this.allowance({ owner, spender })

    if (BN(allowanceValue).isZero()) {
      return this.approve({ spender, amount })
    }
    return false
  }
}
