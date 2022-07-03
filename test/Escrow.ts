import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow, MockERC20 } from "../typechain";

describe("Escrow", async () => {
  let contract: Escrow;
  let erc20: MockERC20;
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let currentTimestamp: number;

  beforeEach(async () => {
    [owner, acc1, acc2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    erc20 = await MockERC20.deploy();

    const Escrow = await ethers.getContractFactory("Escrow");
    contract = await Escrow.deploy();

    await erc20.connect(owner).approve(contract.address, 10);

    currentTimestamp = await getCurrentBlockTimestamp();
  });

  describe("createTransaction", () => {
    it("Should emit events", async () => {
      const timeout = 7 * 24 * 60 * 60;
      const deadline = currentTimestamp + timeout + 1;

      const tx = await createTransaction(
        owner,
        acc1,
        10,
        erc20.address,
        timeout
      );

      const expectedHash = await contract.hashTransaction({
        sender: owner.address,
        receiver: acc1.address,
        amount: 10,
        token: erc20.address,
        deadline,
      });
      expect(await contract._transactionHashes(0)).to.equal(expectedHash);

      await expect(tx)
        .to.emit(contract, "TransactionCreated")
        .withArgs(1, owner.address, acc1.address, erc20.address, 10, deadline);
    });
  });

  describe("executeTransaction", () => {
    const timeout = 7 * 24 * 60 * 60;
    let deadline: number;
    let transaction: any;

    beforeEach(async () => {
      deadline = currentTimestamp + timeout + 1;
      transaction = {
        sender: owner.address,
        receiver: acc1.address,
        amount: 10,
        token: erc20.address,
        deadline,
      };
      await createTransaction(owner, acc1, 10, erc20.address, timeout);
    });

    context("deadline has passed", () => {
      it("Should emit events", async () => {
        // Simulate deadline has passed
        await ethers.provider.send("evm_mine", [deadline + 1]);

        const tx = await contract
          .connect(owner)
          .executeTransaction(1, transaction);

        await tx.wait();

        await expect(tx).to.emit(contract, "TransactionResolved").withArgs(1);
      });
    });

    context("deadline has not passed", () => {
      it("Should revert transaction", async () => {
        // Simulate block timestamp
        await ethers.provider.send("evm_mine", [currentTimestamp + 60 * 60]);

        await expect(
          contract.connect(owner).executeTransaction(1, transaction)
        ).to.revertedWith("Transaction deadline not passed.");
      });
    });
  });

  async function createTransaction(
    sender: SignerWithAddress,
    receiver: SignerWithAddress,
    amount: number,
    token: string,
    timeout: number
  ) {
    const tx = await contract
      .connect(sender)
      .createTransaction(amount, token, receiver.address, timeout);

    await tx.wait();

    return tx;
  }

  async function getCurrentBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});
