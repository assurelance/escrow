import { task } from "hardhat/config";

task("deploy", "Deploys the Escrow proxy and the implementation contract")
    .setAction(async function (taskArguments, hre) {
        const Escrow = await hre.ethers.getContractFactory("Escrow");
        const escrow = await hre.upgrades.deployProxy(Escrow);

        await escrow.deployed();

        console.log("Escrow deployed to:", escrow.address);
    })

task("upgrade", "Upgrade the implementation contract")
    .addPositionalParam("address", "The implementation contract address to be upgraded")
    .setAction(async function (taskArguments, hre) {
        const Escrow = await hre.ethers.getContractFactory("Escrow");
        const escrow = await hre.upgrades.upgradeProxy(taskArguments.address, Escrow);

        console.log("Escrow upgraded to:", escrow.address);
    })