// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICrossChainGateway.sol";
import "./interfaces/ICrossChainMessageState.sol";

contract CrossChainGateway is ICrossChainGateway {

    ICrossChainMessageState public state;
    address public owner;

    address public currentSourceSender;
    uint256 public currentSourceChainId;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _stateContract) {
        require(_stateContract != address(0), "Invalid state contract");
        state = ICrossChainMessageState(_stateContract);
        owner = msg.sender;
    }

    function setStateContract(address _stateContract) external onlyOwner {
        require(_stateContract != address(0), "Invalid state contract");
        state = ICrossChainMessageState(_stateContract);
    }

    function sendMessage(uint256 _targetChainId, address _targetContract, bytes calldata _message) external {
        require(_targetChainId != 0, "Invalid target chain");
        require(_targetContract != address(0), "Invalid target contract");

        uint256 nonce = state.useNonce(_targetChainId, msg.sender);

        bytes32 messageHash = state.computeMessageHash(
            block.chainid, address(this), _targetContract, _message, nonce
        );
        state.setMessageStatus(messageHash, MessageStatus.SENT);

        emit MessageSent(_targetChainId, address(this), msg.sender, _targetContract, _message, nonce);
    }

    function receiveMessage(
        uint256 _sourceChainId,
        address _sourceGateway,
        address _sourceSender,
        address _targetContract,
        bytes calldata _message,
        uint256 _nonce
    ) external {
        require(state.isRelayer(msg.sender), "Not an authorized relayer");
        require(state.isTrustedSource(_sourceChainId, _sourceGateway), "Untrusted source");

        bytes32 messageHash = state.computeMessageHash(
            _sourceChainId, _sourceGateway, _targetContract, _message, _nonce
        );
        require(!state.isProcessed(messageHash), "Message already processed");

        state.markProcessed(messageHash);
        state.setMessageStatus(messageHash, MessageStatus.DELIVERED);

        currentSourceChainId = _sourceChainId;
        currentSourceSender = _sourceSender;

        (bool success, bytes memory result) = _targetContract.call(_message);

        state.setMessageStatus(messageHash, success ? MessageStatus.EXECUTED : MessageStatus.FAILED);

        emit MessageAck(_sourceChainId, messageHash, success, result);

        currentSourceChainId = 0;
        currentSourceSender = address(0);

        emit MessageReceived(_sourceChainId, _sourceGateway, _targetContract, success);
    }

    function processCallback(bytes32 _messageHash, bool /* _success */, bytes calldata /* _result */) external {
        require(state.isRelayer(msg.sender), "Not an authorized relayer");

        bytes32 callbackHash = keccak256(abi.encodePacked(_messageHash, "ack"));
        require(!state.isProcessed(callbackHash), "Callback already processed");

        state.markProcessed(callbackHash);
        state.setMessageStatus(_messageHash, MessageStatus.ACKED);
    }

    function getCrossChainContext() public view returns (uint256 sourceChainId, address sourceSender) {
        return (currentSourceChainId, currentSourceSender);
    }
}
