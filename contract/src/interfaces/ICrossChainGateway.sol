// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICrossChainGateway {
    event MessageSent(uint256 indexed targetChainId, address indexed sourceGateway, address indexed sender, address targetContract, bytes message, uint256 nonce);
    event MessageReceived(uint256 indexed sourceChainId, address indexed sourceGateway, address targetContract, bool success);
    event MessageAck(uint256 indexed sourceChainId, bytes32 indexed messageHash, bool success, bytes result);

    function sendMessage(uint256 targetChainId, address targetContract, bytes calldata message) external;

    function receiveMessage(
        uint256 sourceChainId,
        address sourceGateway,
        address sourceSender,
        address targetContract,
        bytes calldata message,
        uint256 nonce
    ) external;

    function processCallback(bytes32 messageHash, bool success, bytes calldata result) external;

    function getCrossChainContext() external view returns (uint256 sourceChainId, address sourceSender);
}
