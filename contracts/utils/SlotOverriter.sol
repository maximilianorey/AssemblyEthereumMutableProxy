//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract SlotOverriter{
    function tryToCorruptProxyImplmentation(address newAddr) public{
        assembly {
            sstore(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE,newAddr)
        }
    }
}