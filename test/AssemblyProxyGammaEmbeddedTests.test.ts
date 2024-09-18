
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract, Signer } from "ethers";
import { ethers }  from "hardhat";

import { AssemblyProxyGamma__factory } from "../src/AssemblyProxyGamma/AssemblyProxyGamma__factory";
import { ProxyManager__factory } from "../src/ProxyManager/ProxyManager__factory";
import { Typed } from "ethers";

describe("MutableProxyGammaEmbedded", function () {
	it("Should deploy a proxy with controller and call to transparent functions of proxy, and later change implementation", async function () {
		const [ wallet ]: Signer[] = await ethers.getSigners();
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await (await erc20Factory.deploy()).waitForDeployment();

		const proxyManager = await (await new ProxyManager__factory(wallet).deploy()).waitForDeployment();

		const proxyManagerPayable = new Contract(
			await proxyManager.getAddress(),
			[
				{
				  anonymous: false,
				  inputs: [
						{
					  indexed: true,
					  internalType: "address",
					  name: "contractAddress",
					  type: "address",
						},
						{
					  indexed: false,
					  internalType: "address",
					  name: "previousAdmin",
					  type: "address",
						},
						{
					  indexed: false,
					  internalType: "address",
					  name: "newAdmin",
					  type: "address",
						},
				  ],
				  name: "AdminChanged",
				  type: "event",
				},
				{
				  inputs: [
						{
					  internalType: "address",
					  name: "contractAddress",
					  type: "address",
						},
						{
					  internalType: "address",
					  name: "newAdmin",
					  type: "address",
						},
				  ],
				  name: "changeAdmin",
				  outputs: [],
				  stateMutability: "payable",
				  type: "function",
				},
				{
				  inputs: [
						{
					  internalType: "address",
					  name: "firstAdmin",
					  type: "address",
						},
						{
					  internalType: "address",
					  name: "firstImplementation",
					  type: "address",
						},
				  ],
				  name: "deployProxy",
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
					  name: "contractAddress",
					  type: "address",
						},
				  ],
				  name: "getAdmin",
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
			  ],
			  wallet
		);

		await expect(proxyManagerPayable.deployProxy(await wallet.getAddress(),await erc20_1.getAddress(),{ value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");


		const proxyTr = await (await proxyManager.deployProxy(await wallet.getAddress(),await erc20_1.getAddress())).wait(); 


		expect(proxyTr?.logs).to.be.length(1);
		expect(proxyTr?.logs[0].topics).to.be.length(2);

		const proxyAddr = `0x${proxyTr?.logs[0].topics[1].substring(26)}`;

		await expect(proxyManagerPayable.getAdmin(proxyAddr, { value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");
		expect(await proxyManager.getAdmin(proxyAddr)).to.be.equal(await wallet.getAddress());
		await expect(proxyManagerPayable.changeAdmin(proxyAddr, "0x0000000000000000000000000000000000000001",  { value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");



		const proxy = AssemblyProxyGamma__factory.connect(proxyAddr,wallet);

		expect(await proxy.adminFunctionsGet("0")).to.be.equals(await erc20_1.getAddress());
		expect(await proxy.adminFunctionsGet("1")).to.be.equals(await proxyManager.getAddress());
		expect(await proxyManager.getAdmin(Typed.address(await proxy.getAddress()))).to.be.equal(await wallet.getAddress());

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
			proxyManager.changeAdmin(
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000001"
			)
		).to.be.revertedWith("Proxy not registered.");
		
		const txCO = await (
			await proxyManager.changeAdmin(
				await proxy.getAddress(),
				"0x0000000000000000000000000000000000000001"
			)
		).wait();

		expect(await proxyManager.getAdmin(Typed.address(await proxy.getAddress()))).to.be.equal("0x0000000000000000000000000000000000000001");

		await expect(txCO).to.emit(proxyManager,"AdminChanged");

		expect(txCO?.logs).to.length(1);
		expect(txCO?.logs[0].topics[1]).to.be.hexEqual(await proxy.getAddress());
		expect(txCO?.logs[0].data).to.be.hexEqual(`${await wallet.getAddress()}0000000000000000000000000000000000000000000000000000000000000001`);

		await expect(
			proxyManager.changeAdmin(
				await proxy.getAddress(),
				"0x0000000000000000000000000000000000000002"
			)
		).to.be.revertedWith("Caller is not the actual admin.");

		await expect(
			proxy.upgradeTo(await erc20_1.getAddress())
		).to.be.reverted;
	});
});
