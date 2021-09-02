// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import './Utils/Owned.sol';
import './Utils/ATM.sol';

contract PivotArbitrageTrader is Owned, ATM {
  uint256 constant maxApproval = uint256(-1);

  function trade(
    uint256 inputAmount,
    uint256 expectedOutputAmount,
    address ex0Router,
    address[] calldata ex0Path,
    address ex1Router,
    address[] calldata ex1Path,
    address ex2Router,
    address[] calldata ex2Path,
    uint256 deadline
  ) external onlyOwner {
    require(deadline >= block.timestamp, 'TRADE_DEADLINE_EXPIRED');

    uint256 firstSwapOut = swap(inputAmount, ex0Router, ex0Path, deadline);
    uint256 pivotSwapOut = swap(firstSwapOut, ex1Router, ex1Path, deadline);
    uint256 outputAmount = swap(pivotSwapOut, ex2Router, ex2Path, deadline);

    require(outputAmount >= expectedOutputAmount, 'TRADE_OUTPUT_UNDER_EXPECTATIONS');
  }

  //

  function swap(
    uint256 inputAmount,
    address router,
    address[] memory path,
    uint256 deadline
  ) private returns (uint256) {
    IERC20 token = IERC20(address(path[0]));
    require(token.approve(router, maxApproval), 'APPROVE_FAILED');
    return
      IUniswapV2Router02(router).swapExactTokensForTokens(
        inputAmount,
        0,
        path,
        address(this),
        deadline
      )[1];
  }
}
