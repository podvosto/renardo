export const AsyncLoggerFactory = (block: any) => {
  const logs: any[][] = []

  const log = (...line: any[]) => logs.push(line)

  const print = () => {
    const head = `\n[Block #${block}]`
    const fullLog = logs.reduce((lines, line) => [...lines, `\n`, ...line], [head])
    console.log(...fullLog)
  }
  return { log, print }
}
