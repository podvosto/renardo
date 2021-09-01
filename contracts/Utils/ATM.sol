// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import './Owned.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

contract ATM is Owned {
  function withdrawToken(address tokenAddress, uint256 amount) external onlyOwner {
    IERC20(tokenAddress).transfer(msg.sender, amount);
  }
}
