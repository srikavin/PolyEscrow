// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

contract OwnedContract {
    address internal owner;

    constructor () {
        owner = msg.sender;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function setOwner(address newOwner) external ownerOnly {
        owner = newOwner;
    }

    modifier ownerOnly() {
        require(msg.sender == owner);
        _;
    }
}