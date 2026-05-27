// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/interfaces/ICrossChainGateway.sol";
import "../src/interfaces/ICrossChainMessageState.sol";
import "../src/CrossChainMessageState.sol";
import "../src/CrossChainGateway.sol";

contract CrossChainGatewayTest is Test {
    CrossChainMessageState public messageState;
    CrossChainGateway public gateway;

    address public relayer;
    address public hacker = address(0x999);
    address public userA = address(0x111);
    address public targetContract = address(0x222);

    uint256 constant SOURCE_CHAIN = 1;
    uint256 constant TARGET_CHAIN = 2;

    function setUp() public {
        messageState = new CrossChainMessageState();
        gateway = new CrossChainGateway(address(messageState));
        messageState.setGateway(address(gateway));
        relayer = address(this);

        // 配置可信源（模拟跨链环境）
        messageState.setTrustedSourceChain(SOURCE_CHAIN, true);
        messageState.setTrustedSourceContract(SOURCE_CHAIN, address(gateway), true);
    }

    function test_CrossChainSimulation() public {
        bytes memory myMessage = "Hello CrossChain!";

        // ==========================================
        // 场景 1：源链 - 用户A发送跨链请求
        // ==========================================
        vm.startPrank(userA);

        vm.expectEmit(true, true, true, true);
        emit ICrossChainGateway.MessageSent(
            TARGET_CHAIN, address(gateway), userA, targetContract, myMessage, 0
        );

        gateway.sendMessage(TARGET_CHAIN, targetContract, myMessage);
        vm.stopPrank();

        // 验证 nonce
        assertEq(messageState.nonces(TARGET_CHAIN, userA), 1);

        // 验证 SENT 状态（hash 基于 sourceGateway 而非 sender）
        bytes32 sentHash = messageState.computeMessageHash(
            block.chainid, address(gateway), targetContract, myMessage, 0
        );
        assertEq(uint256(messageState.getMessageStatus(sentHash)), uint256(MessageStatus.SENT));

        // ==========================================
        // 场景 2：目标链 - Relayer 接收并转发消息
        // ==========================================
        gateway.receiveMessage(
            SOURCE_CHAIN, address(gateway), userA, targetContract, myMessage, 0
        );

        bytes32 deliveredHash = messageState.computeMessageHash(
            SOURCE_CHAIN, address(gateway), targetContract, myMessage, 0
        );
        assertEq(uint256(messageState.getMessageStatus(deliveredHash)), uint256(MessageStatus.EXECUTED));

        // 验证跨链上下文
        (uint256 ctxChain, address ctxSender) = gateway.getCrossChainContext();
        assertEq(ctxChain, 0);
        assertEq(ctxSender, address(0));

        // ==========================================
        // 场景 3：防重放测试
        // ==========================================
        vm.expectRevert("Message already processed");
        gateway.receiveMessage(
            SOURCE_CHAIN, address(gateway), userA, targetContract, myMessage, 0
        );

        // ==========================================
        // 场景 4：权限测试 (黑客)
        // ==========================================
        vm.startPrank(hacker);
        vm.expectRevert("Not an authorized relayer");
        gateway.receiveMessage(
            SOURCE_CHAIN, address(gateway), userA, targetContract, "Fake", 1
        );
        vm.stopPrank();

        // ==========================================
        // 场景 5：不可信源链测试
        // ==========================================
        vm.expectRevert("Untrusted source");
        gateway.receiveMessage(
            999, address(gateway), userA, targetContract, myMessage, 0
        );
    }

    function test_CrossChainCallback() public {
        bytes memory myMessage = "Callback test";

        vm.startPrank(userA);
        gateway.sendMessage(TARGET_CHAIN, targetContract, myMessage);
        vm.stopPrank();

        // 模拟跨链执行：目标链 receiveMessage
        gateway.receiveMessage(
            SOURCE_CHAIN, address(gateway), userA, targetContract, myMessage, 0
        );

        bytes32 msgHash = messageState.computeMessageHash(
            SOURCE_CHAIN, address(gateway), targetContract, myMessage, 0
        );

        // 模拟回执：源链收到 callback
        gateway.processCallback(msgHash, true, hex"dead");

        // 验证 callback 防重放
        vm.expectRevert("Callback already processed");
        gateway.processCallback(msgHash, true, hex"dead");
    }

    function test_TrustedSourceManagement() public {
        uint256 chainA = 31337;
        address gatewayA = address(0xAAA);

        assertFalse(messageState.trustedSourceChains(chainA));

        messageState.setTrustedSourceChain(chainA, true);
        assertTrue(messageState.trustedSourceChains(chainA));

        messageState.setTrustedSourceContract(chainA, gatewayA, true);
        assertTrue(messageState.isTrustedSource(chainA, gatewayA));

        messageState.setTrustedSourceChain(chainA, false);
        assertFalse(messageState.isTrustedSource(chainA, gatewayA));
    }

    function test_RelayerManagement() public {
        address newRelayer = address(0xBBB);

        assertFalse(messageState.isRelayer(newRelayer));

        messageState.addRelayer(newRelayer);
        assertTrue(messageState.isRelayer(newRelayer));

        messageState.removeRelayer(newRelayer);
        assertFalse(messageState.isRelayer(newRelayer));
    }

    function test_MessageStatusLifecycle() public {
        bytes memory msgData = "status lifecycle";

        vm.startPrank(userA);
        gateway.sendMessage(TARGET_CHAIN, targetContract, msgData);
        vm.stopPrank();

        bytes32 hash = messageState.computeMessageHash(
            block.chainid, address(gateway), targetContract, msgData, 0
        );
        assertEq(uint256(messageState.getMessageStatus(hash)), uint256(MessageStatus.SENT));

        // 模拟跨链接收
        gateway.receiveMessage(
            SOURCE_CHAIN, address(gateway), userA, targetContract, msgData, 0
        );

        bytes32 deliveredHash = messageState.computeMessageHash(
            SOURCE_CHAIN, address(gateway), targetContract, msgData, 0
        );
        assertEq(uint256(messageState.getMessageStatus(deliveredHash)), uint256(MessageStatus.EXECUTED));

        // callback 更新状态
        gateway.processCallback(hash, false, hex"");
        assertEq(uint256(messageState.getMessageStatus(hash)), uint256(MessageStatus.ACKED));
    }
}
