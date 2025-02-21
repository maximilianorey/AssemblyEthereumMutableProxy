//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ProxyManagerEpsilon{
    event AdminChanged(address indexed contractAddress, address previousAdmin, address newAdmin);
    event Upgraded(address indexed contractAddress, address indexed implementation);
    event NewProxy(address indexed contractAddress, address indexed newAdmin, address indexed implementation);

    function getAdmin(address contractAddress) external view returns(address);
    
    function getImplementation(address contractAddress) external view returns(address);

    function changeAdmin(address contractAddress, address newAdmin) external;

    function deployProxy(address firstAdmin, address firstImplementation) external returns(address);

    function upgradeTo(address contractAddress, address newImplementation) external;
}