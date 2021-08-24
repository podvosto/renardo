var ArbitrageTrader = artifacts.require('ArbitrageTrader')

module.exports = function (deployer) {
  deployer.deploy(ArbitrageTrader)
}
