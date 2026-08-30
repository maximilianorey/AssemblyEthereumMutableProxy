//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../contracts/AssemblyProxyDelta.sol";

interface AssemblyProxyDeltaPayable{
    event Upgraded(address indexed implementation);

    function adminFunctionsGet(AssemblyProxyDelta.AdminFuctionGetType func) external payable returns (address);
    
    function upgradeTo(address newImplementation) external payable;
}