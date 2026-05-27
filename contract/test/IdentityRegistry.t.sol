// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

contract IdentityRegistryTest is Test {
    IdentityRegistry internal reg;
    address internal regulator1 = address(0xA11CE);
    address internal regulator2 = address(0xB0B);

    function setUp() public {
        reg = new IdentityRegistry();
    }

    function testCommitAndQuery() public {
        bytes32 c = keccak256("alice-credential-1");
        vm.prank(regulator1);
        reg.commit(c, 1);

        assertTrue(reg.isCommitted(c));
        assertTrue(reg.isActive(c));
        IdentityRegistry.CommitInfo memory info = reg.getCommitInfo(c);
        assertEq(info.chainTag, 1);
        assertEq(info.issuer, regulator1);
        assertEq(info.revokedAt, 0);
        assertEq(reg.totalCommitments(), 1);
    }

    function testRevokeOnlyByIssuer() public {
        bytes32 c = keccak256("alice-credential-2");
        vm.prank(regulator1);
        reg.commit(c, 2);

        vm.expectRevert(IdentityRegistry.NotIssuer.selector);
        vm.prank(regulator2);
        reg.revoke(c);

        vm.prank(regulator1);
        reg.revoke(c);
        assertFalse(reg.isActive(c));
        assertTrue(reg.isCommitted(c));
        assertGt(reg.getCommitInfo(c).revokedAt, 0);
    }

    function testCannotCommitTwice() public {
        bytes32 c = keccak256("dup");
        vm.startPrank(regulator1);
        reg.commit(c, 1);
        vm.expectRevert(IdentityRegistry.CommitmentExists.selector);
        reg.commit(c, 1);
        vm.stopPrank();
    }

    function testCannotRevokeMissing() public {
        vm.prank(regulator1);
        vm.expectRevert(IdentityRegistry.CommitmentMissing.selector);
        reg.revoke(keccak256("nope"));
    }

    function testListPagination() public {
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(regulator1);
            reg.commit(keccak256(abi.encode("c", i)), uint64((i % 2) + 1));
        }
        bytes32[] memory page = reg.listCommitments(2, 2);
        assertEq(page.length, 2);
        assertEq(page[0], keccak256(abi.encode("c", uint256(2))));
        assertEq(page[1], keccak256(abi.encode("c", uint256(3))));

        bytes32[] memory tail = reg.listCommitments(4, 10);
        assertEq(tail.length, 1);

        bytes32[] memory empty = reg.listCommitments(100, 10);
        assertEq(empty.length, 0);
    }
}
