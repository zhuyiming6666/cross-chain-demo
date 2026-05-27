// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICrossChainMessageState.sol";

contract CrossChainMessageState is ICrossChainMessageState {

    address public owner;
    address public gateway;

    mapping(address => bool) public isRelayer;
    mapping(uint256 => bool) public trustedSourceChains;
    mapping(uint256 => mapping(address => bool)) public trustedSourceContracts;
    mapping(uint256 => mapping(address => uint256)) public nonces;
    mapping(bytes32 => bool) public processedMessages;
    mapping(bytes32 => MessageStatus) public messageStatus;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Not gateway");
        _;
    }

    constructor() {
        owner = msg.sender;
        isRelayer[msg.sender] = true;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function setGateway(address _gateway) external onlyOwner {
        require(_gateway != address(0), "Invalid gateway");
        gateway = _gateway;
        emit GatewaySet(_gateway);
    }

    function addRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "Invalid relayer");
        isRelayer[_relayer] = true;
        emit RelayerAdded(_relayer);
    }

    function removeRelayer(address _relayer) external onlyOwner {
        isRelayer[_relayer] = false;
        emit RelayerRemoved(_relayer);
    }

    function setTrustedSourceChain(uint256 _chainId, bool _trusted) external onlyOwner {
        trustedSourceChains[_chainId] = _trusted;
        emit TrustedSourceChainSet(_chainId, _trusted);
    }

    function setTrustedSourceContract(uint256 _chainId, address _sourceContract, bool _trusted) external onlyOwner {
        trustedSourceContracts[_chainId][_sourceContract] = _trusted;
        emit TrustedSourceContractSet(_chainId, _sourceContract, _trusted);
    }

    function isTrustedSource(uint256 _chainId, address _sourceContract) external view returns (bool) {
        return trustedSourceChains[_chainId] && trustedSourceContracts[_chainId][_sourceContract];
    }

    function useNonce(uint256 _chainId, address _sender) external onlyGateway returns (uint256) {
        uint256 current = nonces[_chainId][_sender];
        nonces[_chainId][_sender] = current + 1;
        return current;
    }

    function markProcessed(bytes32 _messageHash) external onlyGateway {
        processedMessages[_messageHash] = true;
    }

    function isProcessed(bytes32 _messageHash) external view returns (bool) {
        return processedMessages[_messageHash];
    }

    function setMessageStatus(bytes32 _messageHash, MessageStatus _status) external onlyGateway {
        messageStatus[_messageHash] = _status;
        emit MessageStatusUpdated(_messageHash, _status);
    }

    function getMessageStatus(bytes32 _messageHash) external view returns (MessageStatus) {
        return messageStatus[_messageHash];
    }

    function computeMessageHash(
        uint256 _sourceChainId,
        address _sourceGateway,
        address _targetContract,
        bytes calldata _message,
        uint256 _nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_sourceChainId, _sourceGateway, _targetContract, _message, _nonce));
    }
}
