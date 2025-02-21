//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ImplementationErrors{
    function implementation() external pure{
        require(false,"Implementation's 'implementation()' function called");
    }

    function upgradeTo(address p) external pure{
        require(false,"Implementation's 'upgradeTo(address)' function called");
    }

    function changeAdmin(address p) external pure{
        require(false,"Implementation's 'changeAdmin(address)' function called");
    }

    function adminFunctionsGet(uint8 func) external pure{
        require(false,"Implementation's 'adminFunctionsGet(uint8)' function called");
    }
    
    function adminFunctionsPut(uint8 func, address parameter) external pure{
        require(false,"Implementation's 'adminFunctionsPut(uint8,address)' function called");
    }
}