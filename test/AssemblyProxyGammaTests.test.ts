
import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";

import { Contract } from "ethers";
import { ethers }  from "hardhat";

import { AssemblyProxyGamma__factory } from "../src/typechain/factories/contracts/AssemblyProxyGamma__factory";
import { ProxyManager__factory } from "../src/AssemblyProxyGamma/ProxyManager__factory";
import { Typed } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MutableProxyGamma", function () {
	async function test(wallet1: HardhatEthersSigner,wallet2: HardhatEthersSigner){
		const erc20Factory = await ethers.getContractFactory("ERC20Imp");
		const erc20_1 = await (await erc20Factory.deploy()).waitForDeployment();

		const proxyManager = await (await new ProxyManager__factory(wallet1).deploy()).waitForDeployment();

		const proxyManagerPayable = new Contract(
			await proxyManager.getAddress(),
			ProxyManager__factory.abi.map(x => ({ ...x, stateMutability: "payable" })),
			  wallet1
		);

		await expect(proxyManagerPayable.deployProxy(await wallet1.getAddress(),await erc20_1.getAddress(),{ value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");


		const proxyTr = await (await proxyManager.deployProxy(await wallet1.getAddress(),await erc20_1.getAddress())).wait(); 


		expect(proxyTr?.logs).to.be.length(1);
		expect(proxyTr?.logs[0].topics).to.be.length(2);

		const proxyAddr = `0x${proxyTr?.logs[0].topics[1].substring(26)}`;

		await expect(proxyManagerPayable.getAdmin(proxyAddr, { value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");
		expect(await proxyManager.getAdmin(proxyAddr)).to.be.equal(await wallet1.getAddress());
		await expect(proxyManagerPayable.changeAdmin(proxyAddr, "0x0000000000000000000000000000000000000001",  { value: 20 })).to.rejectedWith("NOT PAYMENT ALLOWED");



		const proxy = AssemblyProxyGamma__factory.connect(proxyAddr,wallet1);

		expect(await proxy.adminFunctionsGet("0")).to.be.equals(await erc20_1.getAddress());
		expect(await proxy.adminFunctionsGet("1")).to.be.equals(await proxyManager.getAddress());
		expect(await proxyManager.getAdmin(Typed.address(await proxy.getAddress()))).to.be.equal(await wallet1.getAddress());

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

		const payableContract = new Contract(
			await proxy.getAddress(),
			AssemblyProxyGamma__factory.abi.map(x => ({ ...x, stateMutability: "payable" })),
			wallet1
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

		expect((await proxyERC20.balanceOf(await wallet2.getAddress())).toString()).to.be.equal(
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
		expect(txCO?.logs[0].data).to.be.hexEqual(`${await wallet1.getAddress()}0000000000000000000000000000000000000000000000000000000000000001`);

		await expect(
			proxyManager.changeAdmin(
				await proxy.getAddress(),
				"0x0000000000000000000000000000000000000002"
			)
		).to.be.revertedWith("Caller is not the actual admin.");

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

		const proxyManager = await (await new ProxyManager__factory(wallet1).deploy()).waitForDeployment();
		const proxyTr = await (await proxyManager.deployProxy(await wallet2.getAddress(),await implementationErrors_1.getAddress())).wait(); 
		const proxyAddr = `0x${proxyTr?.logs[0].topics[1].substring(26)}`;

		const proxy = AssemblyProxyGamma__factory.connect(proxyAddr,wallet1);

		await expect(proxy.upgradeTo(await implementationErrors_2.getAddress())).to.revertedWith("Implementation's 'upgradeTo(address)' function called");
		await expect(proxy.adminFunctionsGet(0)).to.revertedWith("Implementation's 'adminFunctionsGet(uint8)' function called");
		await expect(proxy.adminFunctionsGet(1)).to.revertedWith("Implementation's 'adminFunctionsGet(uint8)' function called");
	});
});
