//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract BasicUpgradeable is ERC20Upgradeable{
    function init() public initializer{
        __ERC20_init("HELLO", "H");
    }

    function mint(address addr, uint256 amount) public{
        _mint(addr, amount);
    }
}