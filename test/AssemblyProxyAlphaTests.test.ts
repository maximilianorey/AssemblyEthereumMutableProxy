import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract } from "ethers";
import { ethers }  from "hardhat";
import { AssemblyProxyAlpha__factory } from "../src/AssemblyProxyAlpha/AssemblyProxyAlpha__factory";

describe("MutableProxyAlpha", function () {
	it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
		const [ wallet ] = await ethers.getSigners();

		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await erc20Factory.deploy();

		const proxyFactory = new AssemblyProxyAlpha__factory(await wallet.getAddress(),await erc20_1.getAddress(),wallet);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		const proxyERC20 = erc20Factory.attach(await proxy.getAddress());

		expect((await proxyERC20.balanceOf(await wallet.getAddress())).toString()).to.be.equal("0");
		await (await proxyERC20.mint(await wallet.getAddress(), "1000000000000000000")).wait();
		expect((await proxyERC20.balanceOf(await wallet.getAddress())).toString()).to.be.equal(
			"1000000000000000000"
		);

		await (
			await proxyERC20.transfer(
				"0x0000000000000000000000000000000000000001",
				"500000000000000000"
			)
		).wait();

		expect((await proxyERC20.balanceOf(await wallet.getAddress())).toString()).to.be.equal(
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
				await erc20_2_instance.getAddress()
			)
		).wait();

		await expect(txSI).to.emit(proxy,"Upgraded").withArgs(await erc20_2_instance.getAddress());

		expect(await proxyERC20.something()).to.be.equal("ANOTHER NAME");
    
		expect((await proxyERC20.balanceOf(await wallet.getAddress())).toString()).to.be.equal(
			"500000000000000000"
		);

		expect(
			(
				await proxyERC20.balanceOf("0x0000000000000000000000000000000000000001")
			).toString()
		).to.be.equal("500000000000000000");


		const payableContract = new Contract(
			await proxy.getAddress(),
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
				await erc20_1.getAddress(),
				{ value: "20" }
			)
		).to.be.revertedWith("NOT PAYMENT ALLOWED");

		const txCO = await (
			await proxy.changeAdmin(
				"0x0000000000000000000000000000000000000001"
			)
		).wait();

		await expect(txCO).to.emit(proxy,"AdminChanged").withArgs(await wallet.getAddress(),"0x0000000000000000000000000000000000000001");

		await expect(
			proxy.changeAdmin(
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.reverted;

		await expect(
			proxy.upgradeTo(await erc20_1.getAddress())
		).to.be.reverted;
	});
});
