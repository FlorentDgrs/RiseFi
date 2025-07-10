// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {MockedUSDC} from "../src/MockedUSDC.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract rfUSDCTest is Test {
    MockedUSDC public token;
    address public owner = address(this);
    address public user = address(0xBEEF);

    function setUp() public {
        token = new MockedUSDC();
    }

    function test_NameAndSymbol() public {
        assertEq(token.name(), "Mocked USDC");
        assertEq(token.symbol(), "mUSDC");
    }

    function test_Mint() public {
        token.mint(address(this), 1000);
        assertEq(token.balanceOf(address(this)), 1000);
    }

    function test_MintByOwner() public {
        token.mint(owner, 1000);
        assertEq(token.balanceOf(owner), 1000);
    }

    function test_RevertIfNotOwnerMints() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user
            )
        );
        vm.prank(user);
        token.mint(user, 1000);
    }
}
