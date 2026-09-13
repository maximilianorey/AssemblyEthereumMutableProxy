import dotenv from "dotenv";
import { createWalletClient, createPublicClient, EstimateGasReturnType, WaitForTransactionReceiptReturnType, Chain, ContractFunctionArgs, ContractFunctionName, http } from "viem";
import { hdkey } from "@ethereumjs/wallet";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

import AssemblyProxyAlphaJson from "../out/AssemblyProxyAlpha.sol/AssemblyProxyAlpha.js";
import AssemblyProxyBetaJson from "../out/AssemblyProxyBeta.sol/AssemblyProxyBeta.js";
import AssemblyProxyDeltaJson from "../out/AssemblyProxyDelta.sol/AssemblyProxyDelta.js";
import ProxyManagerDeltaJson from "../out/ProxyManagerDelta.sol/ProxyManagerDelta.js";
import ProxyManagerEpsilonJson from "../out/ProxyManagerEpsilon.sol/ProxyManagerEpsilon.js";
import Erc20Json from "../out/ERC20Imp.sol/ERC20Imp.js";
import BasicProxyJson from "../out/BasicProxy.sol/BasicProxy.js";
import { ContractFactory } from "../contractsInterfaces/ContractFactory.js";
import { ContractInstance } from "../contractsInterfaces/ContractInstance.js";
import { startAnvil, stopAnvil } from "../utils/anvil.js";
import { generateMnemonic } from "bip39";

dotenv.config({ path: "./.env" });

const mnemonic = process.env.mnemonic || generateMnemonic();

function printGas<chain extends Chain | undefined>(label: string,gasEstimated: EstimateGasReturnType,receipt: WaitForTransactionReceiptReturnType<chain>){
	console.log(`\t${label}:\tGAS ESTIMATED: ${gasEstimated.toString()}\tGAS USED: ${receipt.gasUsed}`);
}

async function printGasForErc20<FName extends ContractFunctionName<typeof Erc20Json["abi"],"nonpayable" | "payable">>(
	contracts: Array<{ label: string, contract: ContractInstance<typeof Erc20Json["abi"]> }>,
	method: FName,
	args: ContractFunctionArgs<typeof Erc20Json["abi"],"nonpayable" | "payable",FName>
){
	await contracts.reduce(async (acum,{ label,contract }) => {
		await acum;
		console.log(`\t${label}:\tGAS ESTIMATED: ${(await contract.getMethod(method).estimateGas(args)).toString()}\tGAS USED: ${(await contract.getMethod(method).execute(args)).receipt.gasUsed}`);
	},Promise.resolve());
}

async function run() {
	const ethHdKey = hdkey.EthereumHDKey.fromMnemonic(mnemonic);

	const wallet0 = createWalletClient({
		account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/0").getWallet().getPrivateKey()).toString("hex")}`),
		chain: foundry,
		transport: http("http://127.0.0.1:8545"),
	});
	const wallet1 = createWalletClient({
		account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/1").getWallet().getPrivateKey()).toString("hex")}`),
		chain: foundry,
		transport: http("http://127.0.0.1:8545")
	});
	const wallet2 = createWalletClient({
		account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/2").getWallet().getPrivateKey()).toString("hex")}`),
		chain: foundry,
		transport: http("http://127.0.0.1:8545")
	});

	const [ wallet0Addr ] = await wallet0.getAddresses();
	const [ wallet1Addr ] = await wallet1.getAddresses();
	const [ wallet2Address ] = await wallet2.getAddresses();

	const publicClient = createPublicClient({
		chain: foundry,
		transport: http("http://127.0.0.1:8545"),
	});

	const erc20Factory = new ContractFactory(Erc20Json.abi,Erc20Json.bytecode.object);
	console.log("\nDEPLOYING ERC20");
	const erc20 = await erc20Factory.deploy(wallet0,publicClient,[]);
	const erc20Addr = erc20.getAddress();

	
	console.log("\nDEPLOYING BASIC PROXY");
	const basicProxyFactory = new ContractFactory(BasicProxyJson.abi,BasicProxyJson.bytecode.object);
	const basic = await basicProxyFactory.deploy(
		wallet0,
		publicClient,
		[ wallet1Addr ,erc20Addr ],
	);
	


	
	console.log("\nDEPLOYING PROXY ALPHA");
	const proxyRootAlpha = await new ContractFactory(AssemblyProxyAlphaJson.abi,AssemblyProxyAlphaJson.bytecode.object,AssemblyProxyAlphaJson.fromAssemblyConstructors).deploy(wallet0,publicClient, [ wallet1Addr, erc20Addr ]);
	
	console.log("\nDEPLOYING PROXY BETA");
	const proxyRootBeta = await new ContractFactory(AssemblyProxyBetaJson.abi,AssemblyProxyBetaJson.bytecode.object,AssemblyProxyBetaJson.fromAssemblyConstructors).deploy(wallet0,publicClient,[ wallet1Addr, erc20Addr ]);

	
	console.log("\nDEPLOYING PROXY MANAGER DELTA");
	const proxyManagerDelta = await new ContractFactory(ProxyManagerDeltaJson.abi,ProxyManagerDeltaJson.bytecode.object,ProxyManagerDeltaJson.fromAssemblyConstructors).deploy(wallet0,publicClient,[]);
	const deployProxyDeltaTx = await proxyManagerDelta.getMethod("deployProxy").execute([ wallet1Addr,erc20Addr ]);
	const assemblyProxyDeltaAddr = deployProxyDeltaTx.events.find(x => x.eventName==="NewProxy")!.args.contractAddress;

	
	console.log("\nDEPLOYING PROXY MANAGER EPSILON");
	const proxyManagerEpsilon = await new ContractFactory(ProxyManagerEpsilonJson.abi,ProxyManagerEpsilonJson.bytecode.object,ProxyManagerEpsilonJson.fromAssemblyConstructors).deploy(wallet0,publicClient,[]);
	const deployProxyEpsilonTx = await proxyManagerEpsilon.getMethod("deployProxy").execute([ wallet1Addr,erc20Addr ]);
	const assemblyProxyEpsilonAddr =  deployProxyEpsilonTx.events.find(x => x.eventName==="NewProxy")!.args.contractAddress;

	

	const basicProxy = erc20Factory.connect(wallet0,publicClient,basic.getAddress());
	const assemblyProxyAlpha = erc20Factory.connect(wallet0,publicClient,proxyRootAlpha.getAddress());
	const assemblyProxyBeta = erc20Factory.connect(wallet0,publicClient,proxyRootBeta.getAddress());
	const assemblyProxyDelta = erc20Factory.connect(wallet0,publicClient,assemblyProxyDeltaAddr);
	const assemblyProxyEpsilon = erc20Factory.connect(wallet0,publicClient,assemblyProxyEpsilonAddr);


	const erc20Contracts = [
		{ label: "WITHOUT PROXY", contract: erc20 },
		{ label: "ZEPELLING PROXY", contract: basicProxy },
		{ label: "MY PROXY ALPHA", contract: assemblyProxyAlpha },
		{ label: "MY PROXY BETA", contract: assemblyProxyBeta },
		{ label: "MY PROXY DELTA", contract: assemblyProxyDelta },
		{ label: "MY PROXY EPSILON", contract: assemblyProxyEpsilon },
	];


	console.log("\nMINT 20");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 20n ]);

	console.log("\nMINT 20 AGAIN");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 20n ]);

	console.log("\nTRANSFER PART:");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 15n ]);

	console.log("\nTRANSFER TOTAL");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

	console.log("\n\nADMIN FUNCTIONS");

	console.log("\nMINT 20");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 20n ]);

	console.log("\nMINT 20 AGAIN");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 20n ]);

	console.log("\nTRANSFER PART:");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 15n ]);

	console.log("\nTRANSFER TOTAL");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

	console.log("\n\nADMIN FUNCTIONS");
	
	const erc20_2 = await erc20Factory.deploy(wallet0,publicClient,[]);
	const erc20_2Addr = erc20_2.getAddress();

	const proxyRootAlphaW1 = proxyRootAlpha.connect(wallet1);
	const proxyRootBetaW1 = proxyRootBeta.connect(wallet1);
	const proxyRootDeltaW1 = new ContractFactory(AssemblyProxyDeltaJson.abi,AssemblyProxyDeltaJson.bytecode.object).connect(wallet1,publicClient,assemblyProxyDeltaAddr);
	const proxyManagerDeltaW1 = proxyManagerDelta.connect(wallet1);
	const proxyManagerEpsilonW1 = proxyManagerEpsilon.connect(wallet1);

	console.log("\nUPGRADETO");
	printGas(
		"MY PROXY ALPHA",
		await proxyRootAlphaW1.getMethod("upgradeTo").estimateGas([ erc20_2Addr ]),
		(await proxyRootAlphaW1.getMethod("upgradeTo").execute([ erc20_2Addr ])).receipt
	);
	printGas(
		"MY PROXY BETA",
		await proxyRootBetaW1.getMethod("adminFunctionsPut").estimateGas([ 0,erc20_2Addr ]),
		(await proxyRootBetaW1.getMethod("adminFunctionsPut").execute([ 0,erc20_2Addr ])).receipt
	);
	printGas(
		"MY PROXY DELTA",
		await proxyRootDeltaW1.getMethod("upgradeTo").estimateGas([ erc20_2Addr ]),
		(await proxyRootDeltaW1.getMethod("upgradeTo").execute([ erc20_2Addr ])).receipt
	);
	printGas(
		"MY PROXY EPSILON",
		await proxyManagerEpsilonW1.getMethod("upgradeTo").estimateGas([ assemblyProxyEpsilonAddr,erc20_2Addr ]),
		(await proxyManagerEpsilonW1.getMethod("upgradeTo").execute([ assemblyProxyEpsilonAddr,erc20_2Addr ])).receipt
	);

	console.log("\nCHANGE ADMIN");
	printGas(
		"MY PROXY ALPHA",
		await proxyRootAlphaW1.getMethod("changeAdmin").estimateGas([ wallet2Address ]),
		(await proxyRootAlphaW1.getMethod("changeAdmin").execute([ wallet2Address ])).receipt
	);
	printGas(
		"MY PROXY BETA",
		await proxyRootBetaW1.getMethod("adminFunctionsPut").estimateGas([ 1, wallet2Address ]),
		(await proxyRootBetaW1.getMethod("adminFunctionsPut").execute([ 1, wallet2Address ])).receipt
	);
	printGas(
		"MY PROXY DELTA",
		await proxyManagerDeltaW1.getMethod("changeAdmin").estimateGas([ proxyRootDeltaW1.getAddress(), wallet2Address ]),
		(await proxyManagerDeltaW1.getMethod("changeAdmin").execute([ proxyRootDeltaW1.getAddress(),wallet2Address ])).receipt
	);
	printGas(
		"MY PROXY EPSILON",
		await proxyManagerEpsilonW1.getMethod("changeAdmin").estimateGas([ assemblyProxyEpsilonAddr, wallet2Address ]),
		(await proxyManagerEpsilonW1.getMethod("changeAdmin").execute([ assemblyProxyEpsilonAddr, wallet2Address ])).receipt
	);


	const proxyRootAlphaW2 = proxyRootAlpha.connect(wallet2);
	const proxyRootBetaW2 = proxyRootBeta.connect(wallet2);
	const proxyRootDeltaW2 = proxyRootDeltaW1.connect(wallet2);
	const proxyManagerEpsilonW2 = proxyManagerEpsilon.connect(wallet2);

	console.log("\nUPGRADETO");
	printGas(
		"MY PROXY ALPHA",
		await proxyRootAlphaW2.getMethod("upgradeTo").estimateGas([ erc20Addr ]),
		(await proxyRootAlphaW2.getMethod("upgradeTo").execute([ erc20Addr ])).receipt
	);
	printGas(
		"MY PROXY BETA",
		await proxyRootBetaW2.getMethod("adminFunctionsPut").estimateGas([ 0,erc20Addr ]),
		(await proxyRootBetaW2.getMethod("adminFunctionsPut").execute([ 0,erc20Addr ])).receipt
	);
	printGas(
		"MY PROXY DELTA",
		await proxyRootDeltaW2.getMethod("upgradeTo").estimateGas([ erc20Addr ]),
		(await proxyRootDeltaW2.getMethod("upgradeTo").execute([ erc20Addr ])).receipt
	);
	printGas(
		"MY PROXY EPSILON",
		await proxyManagerEpsilonW2.getMethod("upgradeTo").estimateGas([ assemblyProxyEpsilonAddr,erc20Addr ]),
		(await proxyManagerEpsilonW2.getMethod("upgradeTo").execute([ assemblyProxyEpsilonAddr,erc20Addr ])).receipt
	);

}
startAnvil(mnemonic).then(run).catch(console.error).finally(stopAnvil);
