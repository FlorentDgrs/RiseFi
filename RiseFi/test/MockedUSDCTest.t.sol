// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockedUSDC} from "../src/MockedUSDC.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockedUSDCTest is Test {
    MockedUSDC public token;
    address public owner = address(this);
    address public user = address(0xBEEF);
    uint256 public constant INITIAL_SUPPLY = 1000 * 10 ** 6;

    function setUp() public {
        token = new MockedUSDC();
    }

    // ========== TESTS ESSENTIELS (votre logique spécifique) ==========

    function test_NameAndSymbol() public view {
        assertEq(token.name(), "Mocked USDC");
        assertEq(token.symbol(), "mUSDC");
    }

    function test_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    function test_InitialState() public view {
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), address(this));
    }

    function test_MintByOwner() public {
        token.mint(user, INITIAL_SUPPLY);
        assertEq(token.balanceOf(user), INITIAL_SUPPLY);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
    }

    function test_RevertIfNotOwnerMints() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        vm.prank(user);
        token.mint(user, INITIAL_SUPPLY);
    }

    function test_MintEmitsTransferEvent() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), user, INITIAL_SUPPLY);

        token.mint(user, INITIAL_SUPPLY);
    }

    function test_MultipleMints() public {
        uint256 amount1 = 1000 * 10 ** 6;
        uint256 amount2 = 500 * 10 ** 6;

        token.mint(user, amount1);
        token.mint(user, amount2);

        assertEq(token.balanceOf(user), amount1 + amount2);
        assertEq(token.totalSupply(), amount1 + amount2);
    }

    function test_OwnershipTransfer() public {
        token.transferOwnership(user);
        assertEq(token.owner(), user);

        // Ancien owner ne peut plus mint
        vm.expectRevert();
        token.mint(address(this), INITIAL_SUPPLY);

        // Nouveau owner peut mint
        vm.prank(user);
        token.mint(address(this), INITIAL_SUPPLY);
        assertEq(token.balanceOf(address(this)), INITIAL_SUPPLY);
    }

    function test_RenounceOwnership() public {
        token.renounceOwnership();
        assertEq(token.owner(), address(0));

        vm.expectRevert();
        token.mint(user, INITIAL_SUPPLY);
    }

    // ========== TESTS FUZZ (validation robuste) ==========

    function testFuzz_MintToAnyUser(address to, uint256 amount) public {
        vm.assume(to != address(0)); // Exclure l'adresse zéro
        vm.assume(amount < 1_000_000 * 10 ** 6); // Limite raisonnable

        token.mint(to, amount);
        assertEq(token.balanceOf(to), amount);
        assertEq(token.totalSupply(), amount);
    }

    function testFuzz_RevertIfNotOwnerMints(address caller, uint256 amount) public {
        vm.assume(caller != address(this)); // Exclure le owner
        vm.assume(amount > 0);

        vm.expectRevert();
        vm.prank(caller);
        token.mint(caller, amount);
    }

    // ========== TESTS D'INTÉGRATION CRITIQUES ==========

    function test_MintThenTransfer() public {
        // Mint puis transfer - teste l'intégration
        token.mint(address(this), INITIAL_SUPPLY);

        bool success = token.transfer(user, INITIAL_SUPPLY);
        assertTrue(success);
        assertEq(token.balanceOf(user), INITIAL_SUPPLY);
        assertEq(token.balanceOf(address(this)), 0);
    }

    function test_MintThenApproveAndTransferFrom() public {
        // Test d'un workflow complet
        token.mint(address(this), INITIAL_SUPPLY);
        token.approve(user, INITIAL_SUPPLY);

        vm.prank(user);
        bool success = token.transferFrom(address(this), user, INITIAL_SUPPLY);
        assertTrue(success);
        assertEq(token.balanceOf(user), INITIAL_SUPPLY);
    }

    // Event pour les tests
    event Transfer(address indexed from, address indexed to, uint256 value);
}
