// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum MessageStatus {
    NONE,
    SENT,
    DELIVERED,
    EXECUTED,
    FAILED,
    ACKED
}

interface ICrossChainMessageState {
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    event TrustedSourceChainSet(uint256 indexed chainId, bool trusted);
    event TrustedSourceContractSet(uint256 indexed chainId, address indexed sourceContract, bool trusted);
    event GatewaySet(address indexed gateway);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MessageStatusUpdated(bytes32 indexed messageHash, MessageStatus status);

    // Relayer 白名单
    function isRelayer(address relayer) external view returns (bool);
    function addRelayer(address relayer) external;
    function removeRelayer(address relayer) external;

    // 可信源管理
    function trustedSourceChains(uint256 chainId) external view returns (bool);
    function trustedSourceContracts(uint256 chainId, address sourceContract) external view returns (bool);
    function isTrustedSource(uint256 chainId, address sourceContract) external view returns (bool);
    function setTrustedSourceChain(uint256 chainId, bool trusted) external;
    function setTrustedSourceContract(uint256 chainId, address sourceContract, bool trusted) external;

    // Nonce 管理
    function nonces(uint256 chainId, address sender) external view returns (uint256);
    function useNonce(uint256 chainId, address sender) external returns (uint256);

    // 防重放
    function isProcessed(bytes32 messageHash) external view returns (bool);
    function markProcessed(bytes32 messageHash) external;

    // 消息状态
    function messageStatus(bytes32 messageHash) external view returns (MessageStatus);
    function getMessageStatus(bytes32 messageHash) external view returns (MessageStatus);
    function setMessageStatus(bytes32 messageHash, MessageStatus status) external;

    // 工具
    function computeMessageHash(
        uint256 sourceChainId,
        address sourceGateway,
        address targetContract,
        bytes calldata message,
        uint256 nonce
    ) external pure returns (bytes32);

    // 权限
    function owner() external view returns (address);
    function gateway() external view returns (address);
    function setGateway(address gateway) external;
    function transferOwnership(address newOwner) external;
}
