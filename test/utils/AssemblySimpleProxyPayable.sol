//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../contracts/AssemblySimpleProxy.sol";

interface AssemblySimpleProxyPayable{
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function implementation() external payable returns (address);
    
    function adminFunctionsPut(AssemblySimpleProxy.AdminFuctionPutType func, address parameter) payable external;
}