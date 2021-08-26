export interface AsyncLogger {
  log: (...line: any[]) => void
  print: () => void
}
export const AsyncLoggerFactory = (head: any): AsyncLogger => {
  const logs: any[][] = []

  const log = (...line: any[]) => logs.push(line)

  const print = () => {
    const fullLog = logs.reduce((lines, line) => [...lines, `\n`, ...line], [head])
    console.log(...fullLog)
  }
  return { log, print }
}
