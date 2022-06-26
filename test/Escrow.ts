import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow, GIL } from "../typechain";

describe("Escrow", async () => {
  let escrow: Escrow;
  let gil: GIL;
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;

  beforeEach(async () => {
    [owner, acc1, acc2] = await ethers.getSigners();
    const GIL = await ethers.getContractFactory("GIL");
    gil = await GIL.deploy();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
  });

  describe("createTransaction", () => {
    it("Should emit events", async function () {
      await gil.connect(owner).approve(escrow.address, 10);
      const tx = await escrow
        .connect(owner)
        .createTransaction(10, gil.address, acc1.address);

      await tx.wait();

      expect(tx)
        .to.emit(escrow, "TransactionCreated")
        .withArgs(1, owner.address, acc1.address, gil.address, 10);
    });
  });
});
