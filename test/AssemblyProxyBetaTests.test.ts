
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract, Signer } from "ethers";
import { ethers }  from "hardhat";

import { AssemblyProxyBeta__factory } from "../src/AssemblyProxyBeta/AssemblyProxyBeta__factory";

describe("MutableProxyBeta", function () {
	it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
		const [ wallet ]: Signer[] = await ethers.getSigners();
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await (await erc20Factory.deploy()).waitForDeployment();

		const proxyFactory = new AssemblyProxyBeta__factory(await wallet.getAddress(),await erc20_1.getAddress(),wallet);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		expect(await proxy.adminFunctionsGet("0")).to.be.equals(await erc20_1.getAddress());
		expect(await proxy.adminFunctionsGet("1")).to.be.equals(await wallet.getAddress());

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

		expect(await proxy.adminFunctionsGet("0")).to.be.equals(await erc20_2_instance.getAddress());

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
							internalType: "enum AssemblyProxyBeta.AdminFuctionPutType",
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

		await expect(txCO).to.emit(proxy,"AdminChanged").withArgs(await wallet.getAddress(),BigInt(1));

		await expect(
			proxy.adminFunctionsPut(
				"1",
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.reverted;

		await expect(
			proxy.adminFunctionsPut("0",await erc20_1.getAddress())
		).to.be.reverted;
	});
});
