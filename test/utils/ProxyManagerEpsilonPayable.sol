//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ProxyManagerEpsilonPayable{
    function getAdmin(address contractAddress) external payable returns(address);
    
    function getImplementation(address contractAddress) external payable returns(address);

    function changeAdmin(address contractAddress, address newAdmin) external payable;

    function deployProxy(address firstAdmin, address firstImplementation) external payable returns(address);

    function upgradeTo(address contractAddress, address newImplementation) external payable;
}