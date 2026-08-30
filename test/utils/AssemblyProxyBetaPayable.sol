//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../contracts/AssemblyProxyBeta.sol";

interface AssemblyProxyBetaPayable{
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function implementation() external payable returns (address);
    
    function adminFunctionsPut(AssemblyProxyBeta.AdminFuctionPutType func, address parameter) payable external;
}