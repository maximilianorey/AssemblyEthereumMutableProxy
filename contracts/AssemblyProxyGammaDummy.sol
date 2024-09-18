//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AssemblyProxyGammaDummy{
    enum AdminFuctionGetType{ IMPLEMENTATION, ADMIN_STORAGE_ADDRESS }
    event Upgraded(address indexed implementation);

    function adminFunctionsGet(AdminFuctionGetType func) public view returns (address){
        return address(0);
    }
    
    function upgradeTo(address newImplementation) public{
        emit Upgraded(newImplementation);
    }
}