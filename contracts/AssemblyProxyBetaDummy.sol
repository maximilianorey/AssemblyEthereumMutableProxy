//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AssemblyProxyBetaDummy{
    enum AdminFuctionGetType{ IMPLEMENTATION, ADMIN }
    enum AdminFuctionPutType{ UPGRADETO, CHANGEADMIN }
    
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function adminFunctionsGet(AdminFuctionGetType func) public view returns (address){
        return address(0);
    }
    
    function adminFunctionsPut(AdminFuctionPutType func, address parameter) public{
        emit AdminChanged(address(1),parameter);
        emit Upgraded(parameter);
    }
}