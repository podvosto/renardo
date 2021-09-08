import { PivotArbitrageTraderContract } from '../Contracts'
import { blackList } from '../DataService'
import { Route, RouteSwap } from '../Route'
import { Config } from '../Config'
import { Token } from '../Types'
import { BN, toHex } from './BigNumber'
import { ethers } from 'ethers'
import { ITraderContract } from '../Contracts/ITraderContract'

export const calcMinAmount = (amount: string, slippage: string, decimals?: number) => {
  const factor = BN(1).minus(slippage)
  const out = BN(amount).multipliedBy(factor)
  if (decimals === undefined) {
    return out.toFixed()
  }
  return out.toFixed(decimals)
}

export const normalizeSwapRoute = (tokens: Token[]) => tokens.map((t) => t.address)
export const calcDeadline = (deadline: string = Config.maxDeadline) => {
  return toHex(BN(Date.now()).plus(deadline).dividedBy(1000).toFixed(0))
}

export const gasLimitToFactorized = (gasLimit: string) =>
  BN(gasLimit).dividedBy(Math.pow(10, 9)).toFixed()

export const gasLimitToPrecision = (gasLimit: string) =>
  BN(gasLimit).multipliedBy(Math.pow(10, 9)).toFixed()

export const txLink = (hash: string) =>
  ({
    polygon: `https://polygonscan.com/tx/${hash}`,
    binance: `https://bscscan.com/tx/${hash}`
  }[Config.blockchain]!)

export async function getTradeOut(route: Route, inputAmount: string, trader: ITraderContract) {
  let swapOutputAmount = inputAmount
  for (const swap of route.route) {
    swapOutputAmount = await amountsOut(swap, swapOutputAmount)
  }
  const gasLimit = await trader
    .estimateGasForTrade({
      expectedOutputAmount: '0',
      inputAmount,
      route
    })
    .catch((error) => {
      const transferFromFailed =
        error?.error?.error?.message === 'execution reverted: TransferHelper: TRANSFER_FROM_FAILED'
      if (transferFromFailed) {
        // as first pair and last one have wrapped native token
        // the failing token must be on the pivot pair, therefore ban that pair
        const pivotPair = route.route[1].pair
        blackList(pivotPair.address, pivotPair.name)
      }

      throw error
    })

  const outputAmount = BN(swapOutputAmount).minus(gasLimitToFactorized(gasLimit)).toFixed()
  return { outputAmount, swapOutputAmount, gasLimit }
}

async function amountsOut(routeSwap: RouteSwap, amount: string): Promise<string> {
  const { pair, path } = routeSwap

  const firstSwapAmountsOutArg = [toHex(path[0].toPrecision(amount)), normalizeSwapRoute(path)]
  const firstSwapAmountsOut: string[] = await pair.exchange.router
    .getAmountsOut(...firstSwapAmountsOutArg)
    .then((res: ethers.BigNumber[]) =>
      res.map((value, key) => path[key].toFactorized(value.toString()))
    )
    .catch((err: any) => {
      debugger
      throw err
    })

  return firstSwapAmountsOut.pop()!
}
