// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";

/**
 * 部署 IdentityRegistry。
 * 用法：
 *   forge script script/IdentityRegistry.s.sol:IdentityRegistryScript \
 *     --rpc-url http://127.0.0.1:8545 \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast
 */
contract IdentityRegistryScript is Script {
    IdentityRegistry public registry;

    function run() public {
        vm.startBroadcast();
        registry = new IdentityRegistry();
        console.log("IdentityRegistry deployed at:", address(registry));
        vm.stopBroadcast();
    }
}
