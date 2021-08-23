pragma solidity =0.6.6;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

contract Arbitrager {
  address immutable sFactory;


  constructor() public { }
  function trade( uint _inputAmount, uint _expectedOutputAmount address _ex0Router, address[] _ex0Path, address _ex1Router,  address[] _ex1Path ) external {
    IUniswapV2Router02 ex0Router = IUniswapV2Router02(_ex0Router);
    IUniswapV2Router02 ex1Router = IUniswapV2Router02(_ex1Router);

    uint midAmount = ex0Router.swapExactTokensForTokens(_inputAmount, 0, _ex0Path, address(this), deadline)[1];
    uint outputAmount = ex1Router.swapExactTokensForTokens(midAmount, 0, _ex1Path, address(this), deadline)[1];

    require(outputAmount > _expectedOutputAmount, "TRADE_OUTPUT_UNDER_EXPECTATIONS");

    // transfer result 
    address inputToken = _ex0Path[0];
    IERC20 outputToken = IERC20(inputToken);
    outputToken.transfer(msg.sender, _expectedOutputAmount);      

  }
}