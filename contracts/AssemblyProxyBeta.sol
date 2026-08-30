//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface AssemblyProxyBeta{
    enum AdminFuctionPutType{ UPGRADETO, CHANGEADMIN }
    
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function implementation() external view returns (address);
    
    function adminFunctionsPut(AdminFuctionPutType func, address parameter) external;
}