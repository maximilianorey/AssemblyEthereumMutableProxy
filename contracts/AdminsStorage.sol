//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/Strings.sol";

contract AdminsStorage{
    event AdminChanged(address indexed contractAddress, address previousAdmin, address newAdmin);
    mapping (address => address) private admins;

    function getAdmin(address contractAddress) public view returns(address) {
        return admins[contractAddress];
    }

    function getAdmin() view public returns(address) {
        return admins[msg.sender];
    }

    function changeAdmin(address contractAddress, address newAdmin) public {
        address registeredAdmin = admins[contractAddress];
        if(registeredAdmin!=msg.sender){
            require(registeredAdmin!=address(0), "Proxy not registered.");
            require(false, "Caller is not the actual admin.");
            //require(false, string.concat("Caller is not the actual admin. Registered: ",Strings.toHexString(registeredAdmin)," Caller: ", Strings.toHexString(msg.sender)));

        }
        require(newAdmin!=address(0), "Admin can not be zero.");
        admins[contractAddress] = newAdmin;
        emit AdminChanged(contractAddress,msg.sender,newAdmin);
    }

    function registerContract(address firstAdmin) public {
        require(admins[msg.sender]==address(0), "Contract already registered.");
        admins[msg.sender] = firstAdmin;
        emit AdminChanged(msg.sender,address(0),firstAdmin);
    }
}