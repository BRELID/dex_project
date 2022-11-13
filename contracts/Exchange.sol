// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";
import "../node_modules/hardhat/console.sol";
/*
This Exchange contract can do :

Deposit Tokens
Withdraw Tokens
Check Balances

Make Orders
Cancel Orders
Fill Orders

Charge Fees
V - Track Fee Account
*/
contract Exchange {
    address public feeAccount;
    uint256 public feePercent;

    constructor(address _feeAccount, uint256 _feePercent){
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
}