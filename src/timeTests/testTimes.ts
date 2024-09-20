import dotenv from "dotenv";
import { Provider, JsonRpcProvider, Wallet, HDNodeWallet } from "ethers";

import { AssemblyProxyAlpha__factory } from "../AssemblyProxyAlpha/AssemblyProxyAlpha__factory";
import { BasicProxy__factory } from "../typechain/factories/contracts/BasicProxy__factory";
import { BasicUpgradeable__factory } from "../typechain/factories/contracts/BasicUpgradeable__factory";
import { ERC20Imp__factory } from "../typechain/factories/contracts/ERC20Imp__factory";
import { AdminsStorage__factory } from "../typechain/factories/contracts/AdminsStorage__factory";
import { AssemblyProxyBeta__factory } from "../AssemblyProxyBeta/AssemblyProxyBeta__factory";
import { AssemblyProxyGamma__factory } from "../AssemblyProxyGamma/AssemblyProxyGamma__factory";
import { getAllProviders, getProvider } from "../testnetWebs";
import { TransactionExecutor } from "./TransactionExecutor";
import { ProxyManager__factory } from "../ProxyManager/ProxyManager__factory";

dotenv.config({ path: "./.env" });

async function runOne(webName: string, provider: Provider, mnemonic: string) {
	let res = `RESULTS FOR ${webName}:`;
	try{
		const wallet0 = Wallet.fromPhrase(mnemonic).connect(provider);
		const wallet1 = HDNodeWallet.fromPhrase(mnemonic,"m/44'/60'/0'/1").connect(provider);

		const zeppelingUpgradeableFactory = new BasicUpgradeable__factory(wallet0);
		res += "\nDEPLOYING UPGRADEABLE";
		const zeppelingUpgradeable = await zeppelingUpgradeableFactory.deploy();
		await zeppelingUpgradeable.waitForDeployment();
		res += "\nINIT UPGRADEABLE";

		await (await zeppelingUpgradeable.init()).wait();

		const erc20Factory = new ERC20Imp__factory(wallet0);
		res += "\nDEPLOYING ERC20";
		const erc20 = await erc20Factory.deploy();
		await erc20.waitForDeployment();
		const erc20Addr = await erc20.getAddress();
		res += "\nDEPLOYING BASIC PROXY";

		const basicProxyFactory = new BasicProxy__factory(wallet0);
		const basic = await basicProxyFactory.deploy(
			await wallet1.getAddress(),
			erc20Addr
		);
		await basic.waitForDeployment();
		res += "\nDEPLOYING PROXY ALPHA";

		const proxyRootAlpha = await new AssemblyProxyAlpha__factory(await wallet1.getAddress(), erc20Addr, wallet0).deploy();
		await proxyRootAlpha.waitForDeployment();
		res += "\nDEPLOYING PROXY BETA";
		const proxyRootBeta = await new AssemblyProxyBeta__factory(await wallet1.getAddress(), erc20Addr, wallet0).deploy();
		await proxyRootBeta.waitForDeployment();


		res += "\nDEPLOYING ADMINS STORAGE CONTRACT";
		const adminsStorageAddress = await (await (await new AdminsStorage__factory(wallet0).deploy()).waitForDeployment()).getAddress();
	
		res += "\nDEPLOYING PROXY GAMMA";
		const proxyRootGamma = await new AssemblyProxyGamma__factory(await wallet1.getAddress(), erc20Addr, adminsStorageAddress, wallet0).deploy({ nonce: await wallet0.getNonce() });
		await proxyRootGamma.waitForDeployment();

		res += "\nDEPLOYING PROXY MANAGER";
		const proxyManager = await (await new ProxyManager__factory(wallet0).deploy()).waitForDeployment();
		const deployProxyGammaEmbeddedTx = await (await proxyManager.deployProxy(await wallet1.getAddress(),erc20Addr)).wait();
		const myProxyGammaEmbeddedAddr = `0x${deployProxyGammaEmbeddedTx?.logs[0].topics[1].substring(26)}`;

		const basicProxy = ERC20Imp__factory.connect(await basic.getAddress(), wallet0);
		const myProxyAlpha = ERC20Imp__factory.connect(await proxyRootAlpha.getAddress(), wallet0);
		const myProxyBeta = ERC20Imp__factory.connect(await proxyRootBeta.getAddress(), wallet0);
		const myProxyGamma = ERC20Imp__factory.connect(await proxyRootGamma.getAddress(), wallet0);
		const myProxyGammaEmbedded = ERC20Imp__factory.connect(myProxyGammaEmbeddedAddr, wallet0);

		const transactionExecutor = new TransactionExecutor(wallet0, x => {res+=x;}, [
			{ name: "WITHOUT PROXY", contract: erc20 },
			{ name: "ZEPPELING UPGRADEABLE", contract: zeppelingUpgradeable },
			{ name: "OPEN ZEPELLING PROXY", contract: basicProxy },
			{ name: "MY PROXY ALPHA", contract: myProxyAlpha },
			{ name: "MY PROXY BETA", contract: myProxyBeta },
			{ name: "MY PROXY GAMMA", contract: myProxyGamma },
			{ name: "MY PROXY GAMMA EMBRDDED", contract: myProxyGammaEmbedded },
		]);
	
		res += "\nMINT 20";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nMINT 20 AGAIN";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nTRANSFER PART:";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001", "15");
	
		res += "\nTRANSFER TOTAL";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001","5");

		console.log(res);
	}catch(err){
		if(err instanceof Error){
			err.message = `ERROR FOR ${webName}:\ncompute until:\n${res}\nError:\n${err.message}`;
		}
		if(err instanceof String){
			err = `ERROR FOR ${webName}:\ncompute until:\n${res}\nError:\n` + err;
		}
		throw err;
	}
}

function getParameterBlockchainNames(): string | undefined{
	const argIndex = process.argv.findIndex(x => x==="--blockchains");
	if(argIndex !== -1){
		return process.argv[argIndex];
	}
	return process.env.blockchains;
}

function run() {
	let providers: Array<{name: string, provider: JsonRpcProvider}>;

	const mnemonic = process.env.mnemonic;
	if(!mnemonic){
		console.error("MNEMONIC NOT SET ON ENVIRONMENT (.env file)");
		process.exit(1);
	}

	const blockchainsNames = getParameterBlockchainNames();
	if(blockchainsNames){
		providers = [];
		const errors: Array<string> = [];
		blockchainsNames.split(",").forEach(x => {
			const provider = getProvider(x);
			provider.isError ? errors.push(provider.error) : providers.push(provider);
		});
		if(errors.length){
			console.error(errors.join("\n"));
			process.exit(1);
		}
	}else{
		const { res, errors } = getAllProviders();
		providers = res;
		if(errors.length){
			console.error(errors.join("\n"));
		}
	}

	return Promise.all(providers.map(({ name, provider }) => runOne(name,provider,mnemonic).catch(console.error)));
}

run().catch(console.error);
