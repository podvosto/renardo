import { Tokens } from '../DataService'

export const getTokenFromAddress = (tokenAddress: string) =>
  Tokens.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
