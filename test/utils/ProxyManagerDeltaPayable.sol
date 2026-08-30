//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../contracts/AssemblyProxyDelta.sol";

interface ProxyManagerDeltaPayable{
    event AdminChanged(address indexed contractAddress, address previousAdmin, address newAdmin);

    function getAdmin(address contractAddress) external payable returns(address);

    function changeAdmin(address contractAddress, address newAdmin) external payable;

    function deployProxy(address firstAdmin, address firstImplementation) external payable returns(AssemblyProxyDelta);
}