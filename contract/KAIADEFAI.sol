// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@kaiachain/contracts/KIP/token/KIP7/KIP7.sol";

contract KaiaDEFAIUSDT is KIP7 {
    uint256 public constant CLAIM_AMOUNT = 1000;

    constructor() KIP7("KAIADEFAI USDT", "kUSDT") {
        // Mint tokens to the contract itself so users can claim
        _mint(address(this), 1000000000000000 * 10 ** decimals());
    }

    function claim() public {
        require(balanceOf(address(this)) >= (CLAIM_AMOUNT * 10 ** decimals()), "Insufficient contract balance");
        _transfer(address(this), msg.sender, (CLAIM_AMOUNT * 10 ** decimals()));
    }

    function claimFor(address user) public {
        require(user != address(0), "Invalid user");
        _transfer(address(this), user, CLAIM_AMOUNT * 10 ** decimals());
    }

}