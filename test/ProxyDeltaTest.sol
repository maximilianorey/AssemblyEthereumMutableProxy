//SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import "../contracts/ProxyManagerDelta.sol";
import "./utils/AssemblyProxyDeltaPayable.sol";
import "./utils/ProxyManagerDeltaPayable.sol";
import "../contracts/AssemblyProxyDelta.sol";
import "../contracts/ERC20Imp.sol";
import "../contracts/ERC20Imp_2.sol";
import "./SlotOverriter.sol";

contract ProxyDeltaTest is Test {
    address immutable private proxyManagerAddress;

    constructor(){
        bytes memory bytecode = hex"6103C9600081601A8239306101F55230610321523061038552F3346101775736601357335460005260206000F35B60003560E01C806364EFB22B146100B85780631ACFD02A146100C557630A6EAFDD036101475761024480610185600039602435803B610079577FCB06AC210000000000000000000000000000000000000000000000000000000060005260045260246000FD5B600152600080F0602435600435825581806000527F4F62830BD0F7F1B8FD4049DBE971718CF9FC61EAC34094AF474EB17406289A18600080A460206000F35B6004355460005260206000F35B60243580602052600435805480610103577F6C72629E0000000000000000000000000000000000000000000000000000000060005260045260246000FD5B33036101395755336000526004357F4EB572E99196BED0270FBD5B17A948E19C3F50A97838CB0D2A75A823FF8E6C5060406000A2005B638DFA73DB6000526004601CFD5B7FA32852F00000000000000000000000000000000000000000000000000000000060005260003560045260086000FD5B634E7254D66000526004601CFD7F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE556101F6600081604E8239F360003560E01C8063B0EE3AE71461014657633659CFE6036100D2576020600080807F00000000000000000000000000000000000000000000000000000000000000005AFA5060005133036100D257346101DA57600435803B610088577FCB06AC210000000000000000000000000000000000000000000000000000000060005260045260246000FD5B807FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE557FBC7CD75A20EE27FD9ADEBAB32041F755214DBC6BFFA90CC0225B39DA2E5C2D3B600080A2005B7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE54600036818037803681845AF461010E573D6000803E3D6000FD5B7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE54036101E8573D61013C57005B3D6000803E3D6000F35B6020600080807F00000000000000000000000000000000000000000000000000000000000000005AFA5060005133036100D257346101DA576004356101B0577FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE5460005260206000F35B7F000000000000000000000000000000000000000000000000000000000000000060005260206000F35B634E7254D66000526004601CFD5B63363468956000526004601CFD";
        uint256 codelength = bytecode.length;
        address newContract;
        assembly {
            newContract := create(0,add(bytecode,32),codelength)
        }
        proxyManagerAddress = newContract;
    }

    function test_delta() public {
        ERC20Imp erc20_1 = new ERC20Imp();

        ProxyManagerDelta manager = ProxyManagerDelta(proxyManagerAddress);
        
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

        AssemblyProxyDelta proxyAsAdmin = manager.deployProxy(address(this),address(erc20_1));
        ERC20Imp proxy = ERC20Imp(address(AssemblyProxyDelta(address(proxyAsAdmin))));
        require(proxyAsAdmin.adminFunctionsGet(AssemblyProxyDelta.AdminFuctionGetType.IMPLEMENTATION)==address(erc20_1),"WRONG IMPLEMENTATION GETTER");
        require(proxyAsAdmin.adminFunctionsGet(AssemblyProxyDelta.AdminFuctionGetType.PROXY_MANAGER)==address(manager),"WRONG MANAGER GETTER");

        proxy.mint(address(this),400);
        require(keccak256(abi.encodePacked(proxy.something()))==keccak256(abi.encodePacked("HELLO")),"FAILS");
        require(proxy.balanceOf(address(this))==400,"FAILS BALANCE");

        ERC20Imp_2 erc20_2 = new ERC20Imp_2();

        try proxyAsAdmin.upgradeTo(address(1)){
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

        proxyAsAdmin.upgradeTo(address(erc20_2));
        require(proxyAsAdmin.adminFunctionsGet(AssemblyProxyDelta.AdminFuctionGetType.IMPLEMENTATION)==address(erc20_2),"WRONG IMPLEMENTATION GETTER ON NEW ADDRESS");

        proxy.mint(address(this),400);
        require(keccak256(abi.encodePacked(proxy.something()))==keccak256(abi.encodePacked("ANOTHER NAME")),"FAILS ON NEW IMPLEMENTATION");
        require(proxy.balanceOf(address(this))==800,"FAILS BALANCE ON NEW IMPLEMENTATION");

        require(manager.getAdmin(address(proxy))==address(this),"WRONG ADMIN GETTER");
        manager.changeAdmin(address(proxy),address(1));
        require(manager.getAdmin(address(proxy))==address(1),"WRONG ADMIN GETTER ON NEW ADMIN");

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

        ProxyManagerDeltaPayable manager = ProxyManagerDeltaPayable(proxyManagerAddress);

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


        AssemblyProxyDeltaPayable proxy = AssemblyProxyDeltaPayable(address(manager.deployProxy(address(this),address(erc20_1))));

        try manager.getAdmin{value: 12}(address(proxy)){
            require(false,"GET ADMIN SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }


        try proxy.adminFunctionsGet{value: 12}(AssemblyProxyDelta.AdminFuctionGetType.IMPLEMENTATION){
            require(false,"GET IMPLEMENTATION SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        try proxy.adminFunctionsGet{value: 12}(AssemblyProxyDelta.AdminFuctionGetType.PROXY_MANAGER){
            require(false,"GET PROXY_MANAGER SHOULD FAIL WITH PAYMENT");
        }catch (bytes memory err){
            require(err.length==4,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
            uint256 code;
            assembly{
                code := shr(224,mload(add(err,32)))
            }
            require(code==0x4e7254d6,"WRONG ERROR MESSAGE ON GET IMPLEMENTATION WITH PAYMENT");
        }

        try manager.changeAdmin{value: 12}(address(proxy), address(1)){
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
        try proxy.upgradeTo{value: 12}(address(erc20_2)){
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
        ProxyManagerDelta manager = ProxyManagerDelta(proxyManagerAddress);
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
        ProxyManagerDelta manager = ProxyManagerDelta(proxyManagerAddress);
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
