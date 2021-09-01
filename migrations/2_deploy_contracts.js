var DirectArbitrageTrader = artifacts.require('DirectArbitrageTrader')
var PivotArbitrageTrader = artifacts.require('PivotArbitrageTrader')

module.exports = function (deployer) {
  //deployer.deploy(DirectArbitrageTrader)
  deployer.deploy(PivotArbitrageTrader)
}
