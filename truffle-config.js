const HDWalletProvider = require('@truffle/hdwallet-provider')
const dotenv = require('dotenv')

dotenv.config()

module.exports = {
  contracts_directory: './contracts',
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    polygonMainnet: {
      provider: () =>
        new HDWalletProvider(
          process.env.DEPLOYER_MNEMONIC,
          `https://rpc-mainnet.maticvigil.com/v1/e7f0574e6b5761ee482f017f4e03c4405e58c7fa`
        ),
      network_id: 137
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.2'
    }
  }
}
