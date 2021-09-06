export const envVar = (name: string, defaultValue?: any): string => {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${name} not found`)
  }
  return value
}

export const NOOP = () => {}
export function getRandom<T>(arr: any[], n: number): T {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len)
  if (n > len) throw new RangeError('getRandom: more elements taken than available')
  while (n--) {
    var x = Math.floor(Math.random() * len)
    result[n] = arr[x in taken ? taken[x] : x]
    taken[x] = --len in taken ? taken[len] : len
  }
  return result as unknown as T
}
