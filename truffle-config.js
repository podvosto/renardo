const HDWalletProvider = require('@truffle/hdwallet-provider')
const { config } = require('dotenv')

const testNet = !!process.argv.find((v) => v === '--network=polygon_testnet')

config({
  path: testNet ? '.env.test' : '.env'
})

module.exports = {
  /**

  * contracts_build_directory tells Truffle where to store compiled contracts
  */
  contracts_build_directory: './build',

  /**
   * contracts_directory tells Truffle where the contracts you want to compile are located
   */
  contracts_directory: './contracts',

  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '*' // Any network (default: none)
    },
    polygon_mainnet: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: process.env.PROVIDER_JSON_RPC_URL,
          chainId: 137
        }),
      network_id: 137,
      confirmations: 1,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 137
    },
    polygon_testnet: {
      provider: () =>
        new HDWalletProvider({
          privateKeys: [process.env.DEPLOYER_PRIVATE_KEY],
          providerOrUrl: process.env.PROVIDER_JSON_RPC_URL,
          chainId: 80001
        }),
      network_id: 80001,
      confirmations: 1,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 80001
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.2' // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },

  // Truffle DB is enabled in this project by default. Enabling Truffle DB surfaces access to the @truffle/db package
  // for querying data about the contracts, deployments, and networks in this project
  db: {
    enabled: true
  }
}
