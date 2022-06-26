//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GIL is ERC20 {
    constructor() ERC20("GIL Token", "GIL") {
        _mint(msg.sender, 10000);
    }
}
