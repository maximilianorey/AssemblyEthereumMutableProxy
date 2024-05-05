import "@openzeppelin/hardhat-upgrades";

import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { AssemblyProxy__factory } from "../src/AssemblyProxy/AssemblyProxy__factory";

chai.use(solidity);

describe("MutableProxy", function () {
  it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
    const [wallet] = await ethers.getSigners();

    const erc20Factory = await ethers.getContractFactory("ERC20Imp");
    const erc20_1 = await erc20Factory.deploy();

    const proxyFactory = new AssemblyProxy__factory(wallet.address,erc20_1.address,wallet);

    const proxy = await proxyFactory.deploy();

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
      proxy.upgradeTo(
        "0x0000000000000000000000000000000000000001"
      )
    ).to.be.revertedWith("ERC1967: new implementation is not a contract");

    const txSI = await (
      await proxy.upgradeTo(
        erc20_2_instance.address
      )
    ).wait();

    expect(txSI.events?.length).to.be.equal(1);

    if(!txSI.events?.length){ // THIS WILL ALWAYS BE FALSE. IT'S FOR ESLINT RULES.
      return;
    }

    expect(txSI.events[0].event).to.be.equal("Upgraded");
    expect(txSI.events[0].args?.at(0)).to.be.equal(erc20_2_instance.address);

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
              internalType: "address",
              name: "newImplementation",
              type: "address",
            },
          ],
          name: "upgradeTo",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ],
      wallet
    );

    await expect(
      payableContract.upgradeTo(
        erc20_1.address,
        { value: "20" }
      )
    ).to.be.revertedWith("NOT PAYMENT ALLOWED");

    const txCO = await (
      await proxy.changeAdmin(
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
      proxy.changeAdmin(
        "0x0000000000000000000000000000000000000001"
      )
    ).to.be.reverted;

    await expect(
      proxy.upgradeTo(erc20_1.address)
    ).to.be.reverted;
  });
});
