//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Escrow is Initializable {
    struct Transaction {
        address payable sender;
        address payable receiver;
        uint256 amount;
        IERC20 token;
    }

    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed sender,
        address indexed receiver,
        IERC20 token,
        uint256 amount
    );

    bytes32[] public _transactionHashes;

    function initialize() public initializer {}

    function createTransaction(
        uint256 amount,
        IERC20 token,
        address payable receiver
    ) external returns (uint256 transactionId) {
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Not enough approved fund."
        );

        Transaction memory _transaction = Transaction({
            sender: payable(msg.sender),
            receiver: receiver,
            amount: amount,
            token: token
        });

        _transactionHashes.push(hashTransaction(_transaction));
        transactionId = _transactionHashes.length;

        emit TransactionCreated(transactionId, msg.sender, receiver, token, amount);
    }

    function hashTransaction(Transaction memory transaction)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    transaction.sender,
                    transaction.receiver,
                    transaction.amount,
                    transaction.token
                )
            );
    }
}
