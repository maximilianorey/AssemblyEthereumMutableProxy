//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface InvalidFunctions{
    function AnInvalidFunction() external;
    fallback() external;
}