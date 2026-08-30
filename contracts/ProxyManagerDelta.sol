//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./AssemblyProxyDelta.sol";

interface ProxyManagerDelta{
    event AdminChanged(address indexed contractAddress, address previousAdmin, address newAdmin);

    function getAdmin(address contractAddress) external view returns(address);

    function changeAdmin(address contractAddress, address newAdmin) external;

    function deployProxy(address firstAdmin, address firstImplementation) external returns(AssemblyProxyDelta);
}