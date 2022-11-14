// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//import "hardhat/console.sol";
import "../node_modules/hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        require(_spender != address(0));

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {
        // Require that sender has enough tokens to spend
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);

        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(_to != address(0));

        // Deduct tokens from spender
        balanceOf[_from] -= _value;

        //Credit tokens to receiver
        balanceOf[_to] += _value;

        // Emit Event
        emit Transfer(_from, _to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        //console.log(_from, _to, _value);

        // Check approval and the size of the value
        //require(_value <= balanceOf[_from], 'insufficient balance');
        require(_value <= balanceOf[_from]);

        //require(_value <= allowance[_from][msg.sender], 'insufficient allowance');
        require(_value <= allowance[_from][msg.sender]);

        // Reset Allowance
        allowance[_from][msg.sender] -= _value;

        // Spend tokens
        _transfer(_from, _to, _value);
        return true;
    }
}
