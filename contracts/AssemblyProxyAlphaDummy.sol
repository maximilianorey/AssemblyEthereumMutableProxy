//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.26;

contract AssemblyProxyAlphaDummy{
    event AdminChanged(address previousAdmin, address newAdmin);
    event Upgraded(address indexed implementation);
    
    function admin() public view returns(address){
        return address(1);
    }
    
    function implementation() public view returns(address){
        return address(1);
    }

    function changeAdmin(address newAdmin) public{
        emit AdminChanged(address(1), newAdmin);
    }
    
    function upgradeTo(address newImplementation) public{
        emit Upgraded(newImplementation);
    }
}