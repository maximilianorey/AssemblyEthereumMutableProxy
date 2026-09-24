//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface AssemblySimpleProxy{
    enum AdminFuctionPutType{ UPGRADETO, CHANGEADMIN }
    
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);

    error CorruptedRegisters();
    error NotPaymentAllowed();
    error AddressIsNotAContract(address implementation);
    
    function implementation() external view returns (address);
    
    function adminFunctionsPut(AdminFuctionPutType func, address parameter) external;
}