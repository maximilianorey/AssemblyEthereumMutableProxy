//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.26;

interface AssemblyProxyAlpha{
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function admin() external view returns(address);
    
    function implementation() external view returns(address);

    function changeAdmin(address newAdmin) external;
    
    function upgradeTo(address newImplementation) external;
}