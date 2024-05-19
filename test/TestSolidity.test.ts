import { ethers } from "hardhat";

describe("Test Solidity", function () {
    it("Test Solidity", async function (){
        const test2Factory = await ethers.getContractFactory("Test2");
        const test2 = await test2Factory.deploy();
        await (await test2.test()).wait();
    })
})