//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract HasFallback{
    event FallbackCalled(uint256 indexed data);

    fallback(bytes calldata) external returns(bytes memory){
        uint256 twelve = 12;
        bytes memory res = abi.encodePacked(twelve);
        emit FallbackCalled(twelve);
        return res;
    }
}