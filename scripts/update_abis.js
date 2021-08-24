const fs = require('fs')

const ABIS_TO_COPY = { ArbitrageTrader: './build/contracts/ArbitrageTrader.json' }

Object.entries(ABIS_TO_COPY).forEach(([name, buildFilePath]) => {
  const data = fs.readFileSync(buildFilePath).toString()
  const ABI = JSON.stringify(JSON.parse(data).abi, null, 4)
  const outputFilePath = `./src/ABI/${name}.ts`
  console.log(`[${name}] Copied from "${buildFilePath}" to "${outputFilePath}"`)
  fs.writeFileSync(outputFilePath, `export const ${name}ABI=${ABI}`)
})
