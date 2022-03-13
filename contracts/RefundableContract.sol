// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "OwnedContract.sol";

contract RefundableContract is OwnedContract {
    mapping(address => bool) refundWhitelisted;
    uint baseGasRefund;
    uint maxGasRefund;

    constructor () {
        refundWhitelisted[msg.sender] = true;
        baseGasRefund = 21000 + 9700 + 800;
        maxGasRefund = 0.007 ether;
    }

    modifier gasRefunded() {
        uint startGas = gasleft();

        _;


        if (refundWhitelisted[tx.origin]) {
            uint endGas = gasleft();
            uint usedGas = startGas - endGas;

            uint gasCost = usedGas * tx.gasprice + baseGasRefund;
            if (gasCost > maxGasRefund) {
                gasCost = maxGasRefund;
            }

            bool success = payable(tx.origin).send(gasCost);
            require(success, "refund failed");
        }
    }

    function isRefundWhitelisted(address addr) external view returns (bool) {
        return refundWhitelisted[addr];
    }

    function setRefundWhitelisted(address addr, bool shouldWhitelist) external ownerOnly {
        refundWhitelisted[addr] = shouldWhitelist;
    }

    function getBaseGasRefund() external view returns (uint) {
        return baseGasRefund;
    }

    function setBasGasRefund(uint value) external ownerOnly {
        baseGasRefund = value;
    }

    function getMaxGasRefund() external view returns (uint) {
        return maxGasRefund;
    }

    function setMaxGasRefund(uint value) external ownerOnly {
        maxGasRefund = value;
    }

    function deposit() external payable {
    }

    function withdraw() external ownerOnly {
        uint amount = address(this).balance;

        (bool success,) = owner.call{value : amount}('');

        require(success, "Failed to send Ether");
    }
}