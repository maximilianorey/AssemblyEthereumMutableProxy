import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, type EventLog } from "ethers";

import { getAllProviders, getProvider } from "../testnetWebs";
import { AssemblyProxyAlpha__factory } from "../ProxyFactories/AssemblyProxyAlpha__factory";
import { AssemblyProxyBeta__factory } from "../ProxyFactories/AssemblyProxyBeta__factory";
import { ProxyManagerDelta__factory } from "../ProxyFactories/ProxyManagerDelta__factory";
import { ProxyManagerEpsilon__factory } from "../ProxyFactories/ProxyManagerEpsilon__factory";
import { BasicProxy__factory as BasicProxy__factory_forge } from "../forge/BasicProxy__factory";
import { TransactionExecutor } from "./TransactionExecutor";
import { AssemblyProxyDelta__factory, BasicProxy__factory, ERC20Imp__factory } from "../typechain";
import { derivateWallet } from "../utils/utils";

dotenv.config({ path: "./.env" });

async function runOne(webName: string, provider: JsonRpcProvider, mnemonic: string) {
	let res = `RESULTS FOR ${webName}:`;
	try{
		const wallet0 = Wallet.fromPhrase(mnemonic).connect(provider);
		const wallet1 = derivateWallet(mnemonic,1).connect(provider);

		const erc20Factory = new ERC20Imp__factory(wallet0);
		res += "\nDEPLOYING ERC20";
		const erc20 = await erc20Factory.deploy();
		await erc20.waitForDeployment();
		const erc20Addr = await erc20.getAddress();

		res += "\nDEPLOYING BASIC PROXY (hardhat)";
		const basicProxyFactory = new BasicProxy__factory(wallet0);
		const basic = await basicProxyFactory.deploy(
			await wallet1.getAddress(),
			erc20Addr
		);
		await basic.waitForDeployment();

		res += "\nDEPLOYING BASIC PROXY (forge)";
		const basicProxyFactoryForge = new BasicProxy__factory_forge(wallet0);
		const basicForge = await basicProxyFactoryForge.deploy(
			await wallet1.getAddress(),
			erc20Addr
		);
		await basicForge.waitForDeployment();


		res += "\nDEPLOYING PROXY ALPHA";

		const proxyRootAlpha = await new AssemblyProxyAlpha__factory(await wallet1.getAddress(), erc20Addr, wallet0).deploy();
		await proxyRootAlpha.waitForDeployment();
		res += "\nDEPLOYING PROXY BETA";
		const proxyRootBeta = await new AssemblyProxyBeta__factory(await wallet1.getAddress(), erc20Addr, wallet0).deploy();
		await proxyRootBeta.waitForDeployment();

		res += "\nDEPLOYING PROXY MANAGER DELTA";
		const proxyManager = await (await new ProxyManagerDelta__factory(wallet0).deploy()).waitForDeployment();
		const deployProxyDeltaTx = await (await proxyManager.deployProxy(await wallet1.getAddress(),erc20Addr)).wait();
		const myProxyDeltaAddr = (deployProxyDeltaTx?.logs[ 0 ] as EventLog).args[ 0 ];

		res += "\nDEPLOYING PROXY MANAGER EPSILON";
		const proxyManagerEpsilon = await (await new ProxyManagerEpsilon__factory(wallet0).deploy()).waitForDeployment();
		const deployProxyEpsilonTx = await (await proxyManagerEpsilon.deployProxy(await wallet1.getAddress(),erc20Addr)).wait();
		const myProxyEpsilonAddr = (deployProxyEpsilonTx?.logs[ 0 ] as EventLog).args[ 0 ];

		const basicProxy = ERC20Imp__factory.connect(await basic.getAddress(), wallet0);
		const basicProxyForge = ERC20Imp__factory.connect(await basicForge.getAddress(), wallet0);
		const myProxyAlpha = ERC20Imp__factory.connect(await proxyRootAlpha.getAddress(), wallet0);
		const myProxyBeta = ERC20Imp__factory.connect(await proxyRootBeta.getAddress(), wallet0);
		const myProxyDelta = ERC20Imp__factory.connect(myProxyDeltaAddr, wallet0);
		const myProxyEpsilon = ERC20Imp__factory.connect(myProxyEpsilonAddr, wallet0);

		const transactionExecutor = new TransactionExecutor(wallet0, x => {res+= x + "\n";}, [
			{ name: "WITHOUT PROXY", contract: erc20 },
			{ name: "OPEN ZEPELLING PROXY (hardhat)", contract: basicProxy },
			{ name: "OPEN ZEPELLING PROXY (forge)", contract: basicProxyForge },
			{ name: "MY PROXY ALPHA", contract: myProxyAlpha },
			{ name: "MY PROXY BETA", contract: myProxyBeta },
			{ name: "MY PROXY DELTA", contract: myProxyDelta },
			{ name: "MY PROXY EPSILON", contract: myProxyEpsilon },
		]);
	
		res += "\nMINT 20";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nMINT 20 AGAIN";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nTRANSFER PART:";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001", "15");
	
		res += "\nTRANSFER TOTAL";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001","5");


		res += "\nMINT 20";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nMINT 20 AGAIN";
		await transactionExecutor.estimateGasAndExecute(contract => contract.mint,wallet0.address, "20");
	
		res += "\nTRANSFER PART:";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001", "15");
	
		res += "\nTRANSFER TOTAL";
		await transactionExecutor.estimateGasAndExecute(contract => contract.transfer,"0x0000000000000000000000000000000000000001","5");
	
		res += "\n\nADMIN FUNCTIONS";
		const erc20_2 = await erc20Factory.deploy({ nonce: await wallet0.getNonce() });
		await erc20_2.waitForDeployment();
		const erc20_2Addr = await erc20_2.getAddress();
		const proxyRootDelta = AssemblyProxyDelta__factory.connect(myProxyDeltaAddr);
	
		res += "\nUPGRADETO\n";
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY ALPHA", proxyRootAlpha.connect(wallet1).upgradeTo,{ params: [ erc20_2Addr ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY BETA",proxyRootBeta.connect(wallet1).adminFunctionsPut,{ params: [ 0,erc20_2Addr ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY DELTA",proxyRootDelta.connect(wallet1).upgradeTo,{ params: [ erc20_2Addr ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY EPSILON",proxyManagerEpsilon.connect(wallet1).upgradeTo,{ params: [ myProxyEpsilonAddr,erc20_2Addr ], wallet: wallet1 });
		
		
		res += "\nCHANGE ADMIN\n";
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY ALPHA",proxyRootAlpha.connect(wallet1).changeAdmin,{ params: [ await wallet0.getAddress() ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY BETA",proxyRootBeta.connect(wallet1).adminFunctionsPut,{ params: [ 1,await wallet0.getAddress() ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY DELTA",proxyManager.connect(wallet1).changeAdmin,{ params: [ myProxyDeltaAddr, await wallet0.getAddress() ], wallet: wallet1 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY EPSILON",proxyManagerEpsilon.connect(wallet1).changeAdmin,{ params: [ myProxyEpsilonAddr,await wallet0.getAddress() ], wallet: wallet1 });
	
		res += "\nUPGRADETO\n";
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY ALPHA", proxyRootAlpha.upgradeTo,{ params: [ erc20Addr ], wallet: wallet0 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY BETA",proxyRootBeta.adminFunctionsPut,{ params: [ 0,erc20Addr ], wallet: wallet0 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY DELTA",proxyRootDelta.connect(wallet0).upgradeTo,{ params: [ erc20Addr ], wallet: wallet0 });
		await transactionExecutor.estimateGasAndExecuteMethod("MY PROXY EPSILON",proxyManagerEpsilon.upgradeTo,{ params: [ myProxyEpsilonAddr,erc20Addr ], wallet: wallet0 });

		console.log(res);
	}catch(err){
		if(err instanceof String){
			throw `ERROR FOR ${webName}:\ncompute until:\n${res}\nError:\n` + err;
		}
		if(err instanceof Error){
			err.message = `ERROR FOR ${webName}:\ncompute until:\n${res}\nError:\n${err.message}`;
		}
		throw err;
	}
}

function getParameterBlockchainNames(): string | undefined{
	const argIndex = process.argv.findIndex(x => x==="--blockchains");
	if(argIndex !== -1){
		return process.argv[ argIndex+1 ];
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
			if(provider.isError){
				errors.push(provider.error);
			}else{
				providers.push(provider);
			}
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
