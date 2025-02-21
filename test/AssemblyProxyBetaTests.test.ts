
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract } from "ethers";
import { ethers }  from "hardhat";

import { AssemblyProxyBeta__factory } from "../src/ProxyFactories/AssemblyProxyBeta__factory";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MutableProxyBeta", function () {
	async function test(wallet1: HardhatEthersSigner, wallet2: HardhatEthersSigner){
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await (await erc20Factory.deploy()).waitForDeployment();

		const proxyFactory = new AssemblyProxyBeta__factory(await wallet1.getAddress(),await erc20_1.getAddress(),wallet1);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		expect(await proxy.implementation()).to.be.equals(await erc20_1.getAddress());

		const proxyERC20 = erc20Factory.connect(wallet2).attach(await proxy.getAddress());

		expect((await proxyERC20.balanceOf(await wallet2.getAddress())).toString()).to.be.equal("0");
		await (await proxyERC20.mint(await wallet2.getAddress(), "1000000000000000000")).wait();
		expect((await proxyERC20.balanceOf(await wallet2.getAddress())).toString()).to.be.equal(
			"1000000000000000000"
		);

		await (
			await proxyERC20.transfer(
				"0x0000000000000000000000000000000000000001",
				"500000000000000000"
			)
		).wait();

		expect((await proxyERC20.balanceOf(await wallet2.getAddress())).toString()).to.be.equal(
			"500000000000000000"
		);

		expect(
			(
				await proxyERC20.balanceOf("0x0000000000000000000000000000000000000001")
			).toString()
		).to.be.equal("500000000000000000");

		expect(await proxyERC20.something()).to.be.equal("HELLO");

		const erc20_2_instance = await (await (
			await ethers.getContractFactory("ERC20Imp_2")
		).deploy()).waitForDeployment();

		await expect(
			proxy.adminFunctionsPut(
				"0",
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.revertedWith("ERC1967: new implementation is not a contract");

		const txSI = await (
			await proxy.adminFunctionsPut(
				"0",
				await erc20_2_instance.getAddress()
			)
		).wait();

		await expect(txSI).to.emit(proxy,"Upgraded").withArgs(await erc20_2_instance.getAddress());

		expect(await proxy.implementation()).to.be.equals(await erc20_2_instance.getAddress());

		expect(await proxyERC20.something()).to.be.equal("ANOTHER NAME");

		expect((await proxyERC20.balanceOf(await wallet2.getAddress())).toString()).to.be.equal(
			"500000000000000000"
		);

		expect(
			(
				await proxyERC20.balanceOf("0x0000000000000000000000000000000000000001")
			).toString()
		).to.be.equal("500000000000000000");

		const payableContract = new Contract(
			await proxy.getAddress(),
			AssemblyProxyBeta__factory.abi.map(x => ({ ...x, stateMutability: "payable" })),
			wallet1
		);

		await expect(
			payableContract.adminFunctionsPut(
				"0",
				await erc20_1.getAddress(),
				{ value: "20" }
			)
		).to.be.revertedWith("NOT PAYMENT ALLOWED");

		const txCO = await (
			await proxy.adminFunctionsPut(
				"1",
				"0x0000000000000000000000000000000000000001"
			)
		).wait();

		await expect(txCO).to.emit(proxy,"AdminChanged").withArgs(await wallet1.getAddress(),BigInt(1));

		await expect(
			proxy.adminFunctionsPut(
				"1",
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.reverted;

		await expect(
			proxy.adminFunctionsPut("0",await erc20_1.getAddress())
		).to.be.reverted;
	}
	it("Should deploy a proxy with controller and call to transparent functions of proxy with admin wallet, and later change implementation", async function () {
		const [ wallet ] = await ethers.getSigners();
		await test(wallet,wallet);
	});

	it("Should deploy a proxy with controller and call to transparent functions of proxy with a wallet that's not the admin, and later change implementation", async function () {
		const [ wallet1, wallet2 ] = await ethers.getSigners();
		await test(wallet1,wallet2);
	});

	it("If wallet is not the admin all calls should be delegated", async function (){
		const [ wallet1, wallet2 ] = await ethers.getSigners();
		const implementationErrorsFactory = await ethers.getContractFactory("ImplementationErrors");
		const implementationErrors_1 = await implementationErrorsFactory.deploy();
		const implementationErrors_2 = await implementationErrorsFactory.deploy();

		const proxyFactory = new AssemblyProxyBeta__factory(await wallet2.getAddress(),await implementationErrors_1.getAddress(),wallet1);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		await expect(proxy.implementation()).to.revertedWith("Implementation's 'implementation()' function called");
		await expect(proxy.adminFunctionsPut(0,await implementationErrors_2.getAddress())).to.revertedWith("Implementation's 'adminFunctionsPut(uint8,address)' function called");
		await expect(proxy.adminFunctionsPut(1,"0x0000000000000000000000000000000000000001")).to.revertedWith("Implementation's 'adminFunctionsPut(uint8,address)' function called");
	});
});
