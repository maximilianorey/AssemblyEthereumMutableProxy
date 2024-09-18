
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract, Signer } from "ethers";
import { ethers }  from "hardhat";

import { AssemblyProxyGamma__factory } from "../src/AssemblyProxyGamma/AssemblyProxyGamma__factory";
import { Typed } from "ethers";

describe("MutableProxyGamma", function () {
	it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
		const [ wallet ]: Signer[] = await ethers.getSigners();
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await (await erc20Factory.deploy()).waitForDeployment();

		const adminStorage = await (await (await ethers.getContractFactory("AdminsStorage")).deploy()).waitForDeployment();

		const proxyFactory = new AssemblyProxyGamma__factory(await wallet.getAddress(),await erc20_1.getAddress(), await adminStorage.getAddress(),wallet);

		const proxy = await (await proxyFactory.deploy()).waitForDeployment();

		expect(await proxy.adminFunctionsGet("0")).to.be.equals(await erc20_1.getAddress());
		expect(await proxy.adminFunctionsGet("1")).to.be.equals(await adminStorage.getAddress());
		expect(await adminStorage.getAdmin(Typed.address(await proxy.getAddress()))).to.be.equal(await wallet.getAddress());

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

		const payableContract = new Contract(
			await proxy.getAddress(),
			[
				{
					inputs: [
					  {
							internalType: "enum AssemblyProxyGamma.AdminFuctionGetType",
							name: "func",
							type: "uint8",
					  },
					],
					name: "adminFunctionsGet",
					outputs: [
					  {
							internalType: "address",
							name: "",
							type: "address",
					  },
					],
					stateMutability: "payable",
					type: "function",
				},
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
				  }
			],
			wallet
		);

		await expect(
			payableContract.upgradeTo(
				await erc20_1.getAddress(),
				{ value: "20" }
			)
		).to.be.revertedWith("NOT PAYMENT ALLOWED");

		await expect(payableContract.adminFunctionsGet("0", { value: "20" })).to.be.revertedWith("NOT PAYMENT ALLOWED");
		await expect(payableContract.adminFunctionsGet("1", { value: "20" })).to.be.revertedWith("NOT PAYMENT ALLOWED");

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

		await expect(
			adminStorage.changeAdmin(
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.revertedWith("Proxy not registered.");
		
		const txCO = await (
			await adminStorage.changeAdmin(
				await proxy.getAddress(),
				"0x0000000000000000000000000000000000000001"
			)
		).wait();

		expect(await adminStorage.getAdmin(Typed.address(await proxy.getAddress()))).to.be.equal("0x0000000000000000000000000000000000000001");

		await expect(txCO).to.emit(adminStorage,"AdminChanged").withArgs(await proxy.getAddress(), await wallet.getAddress(),BigInt(1));

		await expect(
			adminStorage.changeAdmin(
				await proxy.getAddress(),
				"0x0000000000000000000000000000000000000002"
			)
		).to.be.revertedWith("Caller is not the actual admin.");

		await expect(
			proxy.upgradeTo(await erc20_1.getAddress())
		).to.be.reverted;
	});
});
