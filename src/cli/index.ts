import { program } from 'commander'
import { withdraw } from './commands/withdraw'
console.log(__dirname)

program
  .command('withdraw')
  .description('Withdraw balances from trader SC')
  .argument('<contractAddress>', 'Address of the trader SC')
  .argument('<amount>', 'Amount to be withdrawn')
  .argument('<tokenAddress>', 'Token to be withdrawn')
  .action(withdraw)

program.parse(process.argv)
