// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ICrossChainGateway.sol";

abstract contract CrossChainContext {
    ICrossChainGateway public immutable gateway;

    constructor(address _gateway) {
        gateway = ICrossChainGateway(_gateway);
    }

    function _crossChainSender() internal view returns (address) {
        (, address sourceSender) = gateway.getCrossChainContext();
        return sourceSender == address(0) ? msg.sender : sourceSender;
    }

    function _crossChainSource() internal view returns (uint256 sourceChainId, address sourceSender) {
        (sourceChainId, sourceSender) = gateway.getCrossChainContext();
        if (sourceSender == address(0)) {
            sourceSender = msg.sender;
            sourceChainId = block.chainid;
        }
    }
}
