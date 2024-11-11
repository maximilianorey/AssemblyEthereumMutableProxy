//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface AssemblyProxyGamma{
    enum AdminFuctionGetType{ IMPLEMENTATION, PROXY_MANAGER }
    event Upgraded(address indexed implementation);

    function adminFunctionsGet(AdminFuctionGetType func) external view returns (address);
    
    function upgradeTo(address newImplementation) external;
}