//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import "../contracts/ProxyManagerEpsilon.sol";
import "./utils/ProxyManagerEpsilonPayable.sol";
import "../contracts/ERC20Imp.sol";
import "../contracts/ERC20Imp_2.sol";
import "./SlotOverriter.sol";

contract ProxyEpsilonTest is Test {
    address immutable private proxyManagerAddress;

    constructor(){
        bytes memory bytecode = hex"61039860008160108239306102CE52F3346102705736601357335460005260206000F35B60003560E01C806315AC72CA1461017357806364EFB22B146100F2578063132D807E146101975780631ACFD02A146100FF57630A6EAFDD036102405761011A8061027E600039602435803B61008F577FCB06AC210000000000000000000000000000000000000000000000000000000060005260045260246000FD5B61000152600080F06004358060005281558060243581740100000000000000000000000000000000000000001755600435602435917F4F62830BD0F7F1B8FD4049DBE971718CF9FC61EAC34094AF474EB17406289A18600080A460005260206000F35B6004355460005260206000F35B6024358060205260043580548061013D577F6C72629E0000000000000000000000000000000000000000000000000000000060005260045260246000FD5B33036102325755336000526004357F4EB572E99196BED0270FBD5B17A948E19C3F50A97838CB0D2A75A823FF8E6C5060406000A2005B60043574010000000000000000000000000000000000000000175460005260206000F35B6004355480330361023257602435600435740100000000000000000000000000000000000000001755602435803B6101F6577FCB06AC210000000000000000000000000000000000000000000000000000000060005260045260246000FD5B600052600080602081806004355AF16024356004357F5D611F318680D00598BB735D61BACF0C514C6B50E1E5AD30040A4DF2B12791C7600080A3005B638DFA73DB6000526004601CFD5B7FA32852F00000000000000000000000000000000000000000000000000000000060005260003560045260086000FD5B634E7254D66000526004601CFD7F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE556100CC600081604E8239F3337F000000000000000000000000000000000000000000000000000000000000000014610097577FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE54600036818037803681845AF46061573D6000803E3D6000FD5B7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE540360BE573D608D57005B3D6000803E3D6000F35B6000357FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE55005B63363468956000526004601CFD";
        uint256 codelength = bytecode.length;
        address newContract;
        assembly {
            newContract := create(0,add(bytecode,32),codelength)
        }
        proxyManagerAddress = newContract;
    }
    
    function test_epsilon() public {
        ERC20Imp erc20_1 = new ERC20Imp();

        ProxyManagerEpsilon manager = ProxyManagerEpsilon(proxyManagerAddress);

        try manager.deployProxy(address(this),address(1)){
            require(false,"SHOULD FAIL IF INITIAL IMPLEMENTATION IS NOT A CONTRACT");
        }catch (bytes memory err) {
            require(err.length==36,"INVALID ERROR MESSAGE IF NEW IMPLEMENTATION IS NOT A CONTRACT");
            uint256 code;
            address errorAddr;
            assembly {
                code := shr(224,mload(add(err,32)))
                errorAddr := mload(add(err,36))
            }
            require(code==0xcb06ac21 && errorAddr==address(1),"INVALID ERROR MESSAGE IF NEW IMPLEMENTATION IS NOT A CONTRACT");
        }

        ERC20Imp proxy = ERC20Imp(manager.deployProxy(address(this),address(erc20_1)));
        require(manager.getAdmin(address(proxy))==address(this),"FAILS ON ADMIN GETTER");
        require(manager.getImplementation(address(proxy))==address(erc20_1),"FAILS ON ADMIN GETTER");

        proxy.mint(address(this),400);
        require(keccak256(abi.encodePacked(proxy.something()))==keccak256(abi.encodePacked("HELLO")),"FAILS");
        require(proxy.balanceOf(address(this))==400,"FAILS BALANCE");

        ERC20Imp_2 erc20_2 = new ERC20Imp_2();
        try manager.upgradeTo(address(proxy), address(1)){
            require(false,"SHOULD FAIL IF NEW IMPLEMENTATION IS NOT A CONTRACT");
        }catch (bytes memory err) {
            require(err.length==36,"INVALID ERROR MESSAGE IF NEW IMPLEMENTATION IS NOT A CONTRACT");
            uint256 code;
            address errorAddr;
            assembly {
                code := shr(224,mload(add(err,32)))
                errorAddr := mload(add(err,36))
            }
            require(code==0xcb06ac21 && errorAddr==address(1),"INVALID ERROR MESSAGE IF NEW IMPLEMENTATION IS NOT A CONTRACT");
        }
        manager.upgradeTo(address(proxy), address(erc20_2));
        require(manager.getImplementation(address(proxy))==address(erc20_2),"FAILS ON ADMIN GETTER ON NEW ADDRESS");

        proxy.mint(address(this),400);
        require(keccak256(abi.encodePacked(proxy.something()))==keccak256(abi.encodePacked("ANOTHER NAME")),"FAILS ON NEW IMPLEMENTATION");
        require(proxy.balanceOf(address(this))==800,"FAILS BALANCE ON NEW IMPLEMENTATION");

        manager.changeAdmin(address(proxy),address(1));
        require(manager.getAdmin(address(proxy))==address(1),"FAILS ON ADMIN GETTER ON NEW ADDRESS");

        try manager.changeAdmin(address(proxy),address(2)){
            require(false,"SHOULD FAIL IF NOT ADMIN");
        }catch(bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET CHANGE ADMIN");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x8dfa73db,"WRONG ERROR MESSAGE ON GET CHANGE ADMIN");
        }
    }

    function test_not_payable_error() public{
        ERC20Imp erc20_1 = new ERC20Imp();

        ProxyManagerEpsilonPayable manager = ProxyManagerEpsilonPayable(proxyManagerAddress);


        try manager.deployProxy{value:12}(address(this),address(erc20_1)){
            require(false,"DEPLOY NEW PROXY SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        address proxy = manager.deployProxy(address(this),address(erc20_1));
        try manager.getAdmin{value: 12}(proxy){
            require(false,"GET IMPLEMENTATION SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        try manager.getImplementation{value: 12}(proxy){
            require(false,"GET PROXY_MANAGER SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        try manager.changeAdmin{value: 12}(proxy,address(1)){
            require(false,"CHANGE ADMIN SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        ERC20Imp_2 erc20_2 = new ERC20Imp_2();
        try manager.upgradeTo{value: 12}(proxy,address(erc20_2)){
            require(false,"CHANGE IMPLEMENTATION SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }
    }

    function test_not_found_proxy() public{
        ProxyManagerEpsilon manager = ProxyManagerEpsilon(proxyManagerAddress);
        try manager.changeAdmin(address(1),address(2)){
            require(false,"SHOULD FAIL IF TARGET PROXY DON'T EXISTS");
        }catch(bytes memory err){
            require(err.length==36,"WWWWRONG ERROR MESSAGE ON TARGET PROXY DON'T EXISTS");
            uint256 code;
            address errorAddr;
            assembly{
                code := shr(224,mload(add(err,32)))
                errorAddr := mload(add(err,36))

            }
            require(code==0x6c72629e,"WRONG ERROR MESSAGE ON TARGET PROXY DON'T EXISTS");
        }
    }

    function test_corrupted_register_detection() public{
        SlotOverriter overriter = new SlotOverriter();
        ProxyManagerEpsilon manager = ProxyManagerEpsilon(proxyManagerAddress);
        SlotOverriter proxy = SlotOverriter(address(manager.deployProxy(address(this),address(overriter))));
        ERC20Imp erc20_1 = new ERC20Imp();
        try proxy.tryToCorruptProxyImplmentation(address(erc20_1)){
            require(false,"SHOULD DETECRT IMPLEMENTATION SLOT CORRUPTION");
        }catch (bytes memory err) {
            require(err.length==4,"INVALID ERROR MESSAGE ON IMPLEMENTATION SLOT CORRUPTION");
            uint256 code;
            assembly {
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x36346895,"INVALID ERROR MESSAGE ON IMPLEMENTATION SLOT CORRUPTION");
        }
    }
}