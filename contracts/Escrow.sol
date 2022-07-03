//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Escrow is Initializable {
    struct Transaction {
        address sender;
        address receiver;
        uint256 amount;
        IERC20 token;
        uint256 deadline;
    }

    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed sender,
        address indexed receiver,
        IERC20 token,
        uint256 amount,
        uint256 deadline
    );

    event TransactionResolved(uint256 indexed transactionId);

    bytes32[] public _transactionHashes;

    modifier onlyValidTransaction(
        uint256 transactionId,
        Transaction memory transaction
    ) {
        require(
            _transactionHashes[transactionId - 1] ==
                hashTransaction(transaction),
            "Transaction does not match stored hash."
        );
        _;
    }

    function initialize() public initializer {}

    function createTransaction(
        uint256 amount,
        IERC20 token,
        address payable receiver,
        uint256 timeout
    ) external returns (uint256 transactionId) {
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Not enough approved fund."
        );

        Transaction memory _transaction = Transaction({
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            token: token,
            deadline: block.timestamp + timeout
        });

        _transactionHashes.push(hashTransaction(_transaction));
        transactionId = _transactionHashes.length;

        emit TransactionCreated(
            transactionId,
            msg.sender,
            receiver,
            token,
            amount,
            _transaction.deadline
        );
    }

    function executeTransaction(
        uint256 transactionId,
        Transaction memory transaction
    ) external onlyValidTransaction(transactionId, transaction) {
        require(
            block.timestamp >= transaction.deadline,
            "Transaction deadline not passed."
        );

        uint256 amount = transaction.amount;
        transaction.amount = 0;
        _transactionHashes[transactionId - 1] = hashTransaction(transaction);

        require(
            transaction.token.transfer(transaction.receiver, amount),
            "Failed to transfer fund."
        );

        emit TransactionResolved(transactionId);
    }

    function hashTransaction(Transaction memory transaction)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    transaction.sender,
                    transaction.receiver,
                    transaction.amount,
                    transaction.token,
                    transaction.deadline
                )
            );
    }
}
