// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import './Utils/Owned.sol';

contract ArbitrageTrader is Owned {
  function trade(
    uint256 inputAmount,
    uint256 expectedOutputAmount,
    address ex0Router,
    address[] calldata ex0Path,
    address ex1Router,
    address[] calldata ex1Path,
    uint256 deadline
  ) external onlyOwner {
    require(deadline >= block.timestamp, 'TRADE_DEADLINE_EXPIRED');
    // check balance
    uint256 tokenBalance = IERC20(ex0Path[0]).balanceOf(address(this));
    require(inputAmount <= tokenBalance, 'INPUT_AMOUNT_EXCEEDS_BALANCE');

    uint256 midAmount = _swap(inputAmount, ex0Router, ex0Path, deadline);
    uint256 outputAmount = _swap(midAmount, ex1Router, ex1Path, deadline);
    require(outputAmount >= expectedOutputAmount, 'TRADE_OUTPUT_UNDER_EXPECTATIONS');
  }

  //

  function _swap(
    uint256 inputAmount,
    address router,
    address[] memory path,
    uint256 deadline
  ) private returns (uint256) {
    uint256 MAX_INT = 2**256 - 1;
    IERC20(path[0]).approve(router, MAX_INT);

    IUniswapV2Router02 exRouter = IUniswapV2Router02(router);
    uint256 amountOut = exRouter.swapExactTokensForTokens(
      inputAmount,
      0,
      path,
      address(this),
      deadline
    )[1];

    return amountOut;
  }

  function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
    IERC20(tokenAddress).transfer(msg.sender, amount);
  }
}
