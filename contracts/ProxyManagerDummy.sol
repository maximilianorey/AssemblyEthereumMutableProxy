//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ProxyManagerDummy{
    event AdminChanged(address indexed contractAddress, address previousAdmin, address newAdmin);

    function getAdmin(address contractAddress) public view returns(address) {
        return address(0);
    }

    function changeAdmin(address contractAddress, address newAdmin) public {
        emit AdminChanged(contractAddress,msg.sender,newAdmin);
    }

    function deployProxy(address firstAdmin, address firstImplementation) public returns(address){
        emit AdminChanged(address(0),address(0),firstAdmin);
    }
}