// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";
import "../node_modules/hardhat/console.sol";
import "./Token.sol";

/*
This Exchange contract can do :

1) Deposit Tokens
2) Withdraw Tokens
3) Check Balances

4) Make Orders
5) Cancel Orders
6) Fill Orders

7) Charge Fees
8) Track Fee Account
*/
contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    uint256 public orderCount; // give an id each time we call make Order

    mapping(uint256 => bool) public orderCancelled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );

    event Order(
        uint256 id,
        uint256 timestamp,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive
    );

    event Cancel(
        uint256 id,
        uint256 timestamp,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive
    );

    struct _Order {
        // Attributes of an order
        uint256 id; // Unique identifier for order
        uint256 timestamp; // When order was created
        address user; // User who made order
        address tokenGet; // Address of the token they receive
        uint256 amountGet; // Amount they receive
        address tokenGive; // Address of the token they give
        uint256 amountGive; // Amount they give
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    /********************************************/
    /* 1) Deposit Tokens and 2) Withdraw Tokens */
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

    function withdrawToken(address _token, uint256 _amount) public {
        // Ensure user has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);

        // Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);

        // Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        // Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check Balances
    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    /********************************************/

    /***************************************/
    /* 4) Make Orders and 5) Cancel Orders */

    // Token Give = The token they want to spend - which otken and how much?
    // Token Get = The token they want to receive - which otken and how much?
    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        // Prevent orders if tokens aren't on exchange
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        // Create a new order
        orderCount++;

        orders[orderCount] = _Order(
            orderCount, // id
            block.timestamp, // get the current timestamp
            msg.sender, // user
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive
        );

        // Emit event
        emit Order(
            orderCount,
            block.timestamp,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive
        );
    }

    function cancelOrder(uint256 _id) public {
        // Fetch order
        _Order storage _order = orders[_id];

        // Ensure the caller of the function is the owner of the order
        require(address(_order.user) == msg.sender);

        // Order must exist
        require(_order.id == _id);

        // Cancel the order
        orderCancelled[_id] = true;

        // Emit event
        emit Cancel(
            _order.id,
            block.timestamp,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );
    }
    /***************************************/
}
