//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract AssemblyProxyBetaDummy{
    enum AdminFuctionGetType{ IMPLEMENTATION, ADMIN }
    enum AdminFuctionPutType{ UPGRADETO, CHANGEADMIN }
    function adminFunctionsGet(AdminFuctionGetType func) public view returns (address){
        return address(0);
    }
    function adminFunctionsPut(AdminFuctionPutType func, address parameter) public{
    }
}