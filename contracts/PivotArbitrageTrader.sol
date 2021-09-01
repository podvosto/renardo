// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import './Utils/Owned.sol';

contract PivotArbitrageTrader is Owned {
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
    safeApprove(path[0], router, maxApproval);

    IUniswapV2Router02 exRouter = IUniswapV2Router02(router);

    uint256 amountOut = exRouter.swapExactTokensForTokens(
      inputAmount,
      0,
      path,
      address(this),
      deadline
    )[path.length - 1];

    return amountOut;
  }

  function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
    IERC20(tokenAddress).transfer(msg.sender, amount);
  }

  function safeApprove(
    address tokenAddress,
    address spender,
    uint256 amount
  ) internal {
    IERC20 token = IERC20(tokenAddress);
    uint256 allowance = token.allowance(address(this), address(spender));

    if (allowance != 0) {
      token.approve(spender, 0);
    }
    token.approve(spender, amount);
  }
}
