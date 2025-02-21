import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract } from "ethers";
import { ethers }  from "hardhat";
import { AssemblyProxyAlpha__factory } from "../src/ProxyFactories/AssemblyProxyAlpha__factory";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MutableProxyAlpha", function () {
	async function test(wallet1: HardhatEthersSigner, wallet2: HardhatEthersSigner){
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await erc20Factory.deploy();

		const proxyFactory = new AssemblyProxyAlpha__factory(await wallet1.getAddress(),await erc20_1.getAddress(),wallet1);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

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
			AssemblyProxyAlpha__factory.abi.map(x => ({ ...x, stateMutability: "payable" })),
			wallet1
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

		await expect(txCO).to.emit(proxy,"AdminChanged").withArgs(await wallet1.getAddress(),"0x0000000000000000000000000000000000000001");

		await expect(
			proxy.changeAdmin(
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.reverted;

		await expect(
			proxy.upgradeTo(await erc20_1.getAddress())
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

		const proxyFactory = new AssemblyProxyAlpha__factory(await wallet2.getAddress(),await implementationErrors_1.getAddress(),wallet1);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		await expect(proxy.implementation()).to.revertedWith("Implementation's 'implementation()' function called");
		await expect(proxy.upgradeTo(await implementationErrors_2.getAddress())).to.revertedWith("Implementation's 'upgradeTo(address)' function called");
		await expect(proxy.changeAdmin("0x0000000000000000000000000000000000000001")).to.revertedWith("Implementation's 'changeAdmin(address)' function called");
	});
});
