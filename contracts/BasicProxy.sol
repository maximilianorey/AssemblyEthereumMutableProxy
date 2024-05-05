//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract BasicProxy is TransparentUpgradeableProxy{
    constructor(address owner, address implementation) TransparentUpgradeableProxy(implementation,owner,new bytes(0)){
    }
}