import "@openzeppelin/hardhat-upgrades";

import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { AssemblyProxyBeta__factory } from "../src/AssemblyProxyBeta/AssemblyProxyBeta__factory";

chai.use(solidity);

describe("MutableProxyBeta", function () {
  it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
    const [wallet] = await ethers.getSigners();
    const erc20Factory = await ethers.getContractFactory("ERC20Imp");
    const erc20_1 = await erc20Factory.deploy();

    const proxyFactory = new AssemblyProxyBeta__factory(wallet.address,erc20_1.address,wallet);

    const proxy = await proxyFactory.deploy();

    expect(await proxy.adminFunctionsGet("0")).to.be.equals(erc20_1.address);
    expect(await proxy.adminFunctionsGet("1")).to.be.equals(wallet.address);

    const proxyERC20 = erc20Factory.attach(proxy.address);

    expect((await proxyERC20.balanceOf(wallet.address)).isZero()).to.be.equal(true);
    await (await proxyERC20.mint(wallet.address, "1000000000000000000")).wait();
    expect((await proxyERC20.balanceOf(wallet.address)).toString()).to.be.equal(
      "1000000000000000000"
    );

    await (
      await proxyERC20.transfer(
        "0x0000000000000000000000000000000000000001",
        "500000000000000000"
      )
    ).wait();

    expect((await proxyERC20.balanceOf(wallet.address)).toString()).to.be.equal(
      "500000000000000000"
    );

    expect(
      (
        await proxyERC20.balanceOf("0x0000000000000000000000000000000000000001")
      ).toString()
    ).to.be.equal("500000000000000000");

    expect(await proxyERC20.something()).to.be.equal("HELLO");

    const erc20_2_instance = await (
      await ethers.getContractFactory("ERC20Imp_2")
    ).deploy();

    await expect(
      proxy.adminFunctionsPut(
        "0",
        "0x0000000000000000000000000000000000000001"
      )
    ).to.be.revertedWith("ERC1967: new implementation is not a contract");

    const txSI = await (
      await proxy.adminFunctionsPut(
        "0",
        erc20_2_instance.address
      )
    ).wait();

    expect(txSI.events?.length).to.be.equal(1);

    if(!txSI.events?.length){ // THIS WILL ALWAYS BE FALSE. IT'S FOR ESLINT RULES.
      return;
    }

    expect(txSI.events[0].event).to.be.equal("Upgraded");
    expect(txSI.events[0].args?.at(0)).to.be.equal(erc20_2_instance.address);

    expect(await proxy.adminFunctionsGet("0")).to.be.equals(erc20_2_instance.address);

    expect(await proxyERC20.something()).to.be.equal("ANOTHER NAME");

    expect((await proxyERC20.balanceOf(wallet.address)).toString()).to.be.equal(
      "500000000000000000"
    );

    expect(
      (
        await proxyERC20.balanceOf("0x0000000000000000000000000000000000000001")
      ).toString()
    ).to.be.equal("500000000000000000");

    const payableContract = new Contract(
      proxy.address,
      [
        {
          inputs: [
            {
              internalType: "enum AssemblyProxyBetaDummy.AdminFuctionPutType",
              name: "func",
              type: "uint8",
            },
            {
              internalType: "address",
              name: "parameter",
              type: "address",
            },
          ],
          name: "adminFunctionsPut",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        }
      ],
      wallet
    );

    await expect(
      payableContract.adminFunctionsPut(
        "0",
        erc20_1.address,
        { value: "20" }
      )
    ).to.be.revertedWith("NOT PAYMENT ALLOWED");

    const txCO = await (
      await proxy.adminFunctionsPut(
        "1",
        "0x0000000000000000000000000000000000000001"
      )
    ).wait();

    expect(txCO.events?.length).to.be.equal(1);

    if(!txCO.events?.length){ // THIS WILL ALWAYS BE FALSE. IT'S FOR ESLINT RULES.
      return;
    }

    expect(txCO.events[0].event).to.be.equal("AdminChanged");
    
    expect(txCO.events[0].args?.at(0)).to.be.equal(wallet.address);
    expect(txCO.events[0].args?.at(1)).to.be.equal(
      "0x0000000000000000000000000000000000000001"
    );

    await expect(
      proxy.adminFunctionsPut(
        "1",
        "0x0000000000000000000000000000000000000001"
      )
    ).to.be.reverted;

    await expect(
      proxy.adminFunctionsPut("0",erc20_1.address)
    ).to.be.reverted;
  });
});
