export * from './BigNumber'
export * from './ERC20'
export * from './Trade'
export * from './Pair'

export const envVar = (name: string, defaultValue?: any) => {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${name} not found`)
  }
  return value
}

export const NOOP = () => {}
