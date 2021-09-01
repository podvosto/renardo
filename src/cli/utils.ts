import { Tokens } from '../Config'

export const getTokenFromAddress = (tokenAddress: string) =>
  Object.values(Tokens).find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
