//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface AssemblyProxyAlphaPayable{
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function implementation() external payable returns(address);

    function changeAdmin(address newAdmin) external payable;
    
    function upgradeTo(address newImplementation) external payable;
}