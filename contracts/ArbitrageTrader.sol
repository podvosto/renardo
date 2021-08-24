// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

contract ArbitrageTrader {
  function trade(
    uint256 inputAmount,
    uint256 expectedOutputAmount,
    address ex0Router,
    address[] calldata ex0Path,
    address ex1Router,
    address[] calldata ex1Path,
    uint256 deadline
  ) external returns (uint256) {
    require(deadline >= block.timestamp, 'TRADE_DEADLINE_EXPIRED');

    uint256 midAmount = _swap(inputAmount, ex0Router, ex0Path, deadline);
    uint256 outputAmount = _swap(midAmount, ex1Router, ex1Path, deadline);

    require(outputAmount > expectedOutputAmount, 'TRADE_OUTPUT_UNDER_EXPECTATIONS');

    // transfer result
    IERC20 outputToken = IERC20(ex0Path[0]);
    outputToken.transfer(msg.sender, expectedOutputAmount);

    return outputAmount;
  }

  function _swap(
    uint256 inputAmount,
    address router,
    address[] memory path,
    uint256 deadline
  ) private returns (uint256) {
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
}
