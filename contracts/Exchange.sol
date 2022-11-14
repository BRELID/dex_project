// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";
import "../node_modules/hardhat/console.sol";
import "./Token.sol";

/*
This Exchange contract can do :

1) Deposit Tokens - V
2) Withdraw Tokens
3) Check Balances

4) Make Orders
5) Cancel Orders
6) Fill Orders

7) Charge Fees
8) Track Fee Account - V
*/
contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    /*********************/
    /* 1) Deposit Tokens */
    function depositToken(address _token, uint256 _amount) public {
        // Transfer tokens to exchange
        // msg.sender = The person who wants to make the deposit by initiating the contract
        // address(this) = This refers to the contract address of the exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        // Update user balance
        tokens[_token][msg.sender] += _amount;
        // Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    /*********************/

    // Check Balances
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }
}
