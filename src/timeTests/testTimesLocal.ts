import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, HDNodeWallet } from "ethers";

import { AssemblyProxyAlpha__factory } from "../AssemblyProxyAlpha/AssemblyProxyAlpha__factory";
import { BasicProxy__factory } from "../typechain/factories/contracts/BasicProxy__factory";
import { BasicUpgradeable__factory } from "../typechain/factories/contracts/BasicUpgradeable__factory";
import { ERC20Imp__factory } from "../typechain/factories/contracts/ERC20Imp__factory";
import { AdminsStorage__factory } from "../typechain/factories/contracts/AdminsStorage__factory";
import { AssemblyProxyBeta__factory } from "../AssemblyProxyBeta/AssemblyProxyBeta__factory";
import { AssemblyProxyGamma__factory } from "../AssemblyProxyGamma/AssemblyProxyGamma__factory";
import { TransactionExecutor } from "./TransactionExecutor";
import { ProxyManager__factory } from "../ProxyManager/ProxyManager__factory";

dotenv.config({ path: "./.env" });

async function run() {
	const provider = new JsonRpcProvider("http://localhost:8545");

	const mnemonic = process.env.mnemonic;
	if(!mnemonic){
		console.error("MNEMONIC NOT SET ON ENVIRONMENT (.env file)");
		process.exit(1);
	}

	const wallet0 = Wallet.fromPhrase(mnemonic).connect(provider);
	const wallet1 = HDNodeWallet.fromPhrase(mnemonic,"m/44'/60'/0'/1").connect(provider);


	const zeppelingUpgradeableFactory = new BasicUpgradeable__factory(wallet0);
	console.log("\nDEPLOYING UPGRADEABLE");
	const zeppelingUpgradeable = await zeppelingUpgradeableFactory.deploy({ nonce: await wallet0.getNonce() });
	await zeppelingUpgradeable.waitForDeployment();
	console.log("\nINIT UPGRADEABLE");

	await (await zeppelingUpgradeable.init({ nonce: await wallet0.getNonce() })).wait();

	const erc20Factory = new ERC20Imp__factory(wallet0);
	console.log("\nDEPLOYING ERC20");
	const erc20 = await erc20Factory.deploy({ nonce: await wallet0.getNonce() });
	await erc20.waitForDeployment();
	const erc20Addr = await erc20.getAddress();
	console.log("\nDEPLOYING BASIC PROXY");

	const basicProxyFactory = new BasicProxy__factory(wallet0);
	const basic = await basicProxyFactory.deploy(
		wallet1.address,
		erc20Addr,
		{ nonce: await wallet0.getNonce() }
	);
	await basic.waitForDeployment();
	
	console.log("\nDEPLOYING PROXY ALPHA");

	const proxyRootAlpha = await new AssemblyProxyAlpha__factory(wallet1.address, erc20Addr, wallet0).deploy({ nonce: await wallet0.getNonce() });
	await proxyRootAlpha.waitForDeployment();
	console.log("\nDEPLOYING PROXY BETA");
	const proxyRootBeta = await new AssemblyProxyBeta__factory(wallet1.address, erc20Addr, wallet0).deploy({ nonce: await wallet0.getNonce() });
	await proxyRootBeta.waitForDeployment();

	console.log("\nDEPLOYING ADMINS STORAGE CONTRACT");
	const adminsStorageAddress = await (await (await new AdminsStorage__factory(wallet0).deploy()).waitForDeployment()).getAddress();

	console.log("\nDEPLOYING PROXY GAMMA");
	const proxyRootGamma = await new AssemblyProxyGamma__factory(wallet1.address, erc20Addr, adminsStorageAddress, wallet0).deploy({ nonce: await wallet0.getNonce() });
	await proxyRootGamma.waitForDeployment();

	console.log("\nDEPLOYING PROXY MANAGER");
	const proxyManager = await (await new ProxyManager__factory(wallet0).deploy()).waitForDeployment();
	const deployProxyGammaEmbeddedTx = await (await proxyManager.deployProxy(await wallet1.getAddress(),erc20Addr)).wait();
	const myProxyGammaEmbeddedAddr = `0x${deployProxyGammaEmbeddedTx?.logs[0].topics[1].substring(26)}`;

	const basicProxy = ERC20Imp__factory.connect(await basic.getAddress(), wallet0);
	const myProxyAlpha = ERC20Imp__factory.connect(await proxyRootAlpha.getAddress(), wallet0);
	const myProxyBeta = ERC20Imp__factory.connect(await proxyRootBeta.getAddress(), wallet0);
	const myProxyGamma = ERC20Imp__factory.connect(await proxyRootGamma.getAddress(), wallet0);
	const myProxyGammaEmbedded = ERC20Imp__factory.connect(myProxyGammaEmbeddedAddr, wallet0);

	const transactionExecutor = new TransactionExecutor(wallet0,console.log, [
		{ name: "WITHOUT PROXY", contract: erc20 },
		{ name: "ZEPPELING UPGRADEABLE", contract: zeppelingUpgradeable },
		{ name: "OPEN ZEPELLING PROXY", contract: basicProxy },
		{ name: "MY PROXY ALPHA", contract: myProxyAlpha },
		{ name: "MY PROXY BETA", contract: myProxyBeta },
		{ name: "MY PROXY GAMMA", contract: myProxyGamma },
		{ name: "MY PROXY GAMMA EMBRDDED", contract: myProxyGammaEmbedded },
	]);

	console.log("\nMINT 20");
	await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");

	console.log("\nMINT 20 AGAIN");
	await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");

	console.log("\nTRANSFER PART:");
	await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001", "15");

	console.log("\nTRANSFER TOTAL");
	await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001","5");
}

run().catch(console.error);
