//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Imp is ERC20{
    constructor() ERC20("HELLO","H"){}

    function mint(address account, uint256 amount) public{
        _mint(account, amount);
    }

    function something() pure public returns (string memory){
        return "HELLO";
    }
}