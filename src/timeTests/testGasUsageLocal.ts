import { generateMnemonic } from "bip39";
import { hdkey } from "@ethereumjs/wallet";
import dotenv from "dotenv";
import { createWalletClient, createPublicClient, EstimateGasReturnType, WaitForTransactionReceiptReturnType, Chain, ContractFunctionArgs, ContractFunctionName, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

import SimpleProxyJson from "../out/AssemblySimpleProxy.sol/AssemblySimpleProxy.js";
import SecureProxyManagerJson from "../out/SecureProxyManager.sol/SecureProxyManager.js";
import Erc20Json from "../out/ERC20Imp.sol/ERC20Imp.js";
import BasicProxyJson from "../out/BasicProxy.sol/BasicProxy.js";
import { ContractFactory } from "../contractsInterfaces/ContractFactory.js";
import { ContractInstance } from "../contractsInterfaces/ContractInstance.js";
import { startAnvil, stopAnvil } from "../utils/anvil.js";

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

	const client = createPublicClient({
		chain: foundry,
		transport: http("http://127.0.0.1:8545"),
	});

	const erc20Factory = new ContractFactory(Erc20Json.abi,Erc20Json.bytecode.object);
	console.log("\nDEPLOYING ERC20");
	const erc20 = await erc20Factory.deploy(wallet0,client,[]);
	const erc20Addr = erc20.getAddress();

	
	console.log("\nDEPLOYING BASIC PROXY");
	const basicProxyFactory = new ContractFactory(BasicProxyJson.abi,BasicProxyJson.bytecode.object);
	const basic = await basicProxyFactory.deploy(
		wallet0,
		client,
		[ wallet1Addr ,erc20Addr ],
	);
	


	
	console.log("\nDEPLOYING SIMPLE PROXY");
	const proxyRootSimple = await new ContractFactory(SimpleProxyJson.abi,SimpleProxyJson.bytecode.object,SimpleProxyJson.fromAssemblyConstructors).deploy(wallet0,client,[ wallet1Addr, erc20Addr ]);

	console.log("\nDEPLOYING SECURE PROXY MANAGER");
	const SecureProxyManager = await new ContractFactory(SecureProxyManagerJson.abi,SecureProxyManagerJson.bytecode.object,SecureProxyManagerJson.fromAssemblyConstructors).deploy(wallet0,client,[]);
	const deploySecureProxyTx = await SecureProxyManager.getMethod("deployProxy").execute([ wallet1Addr,erc20Addr ]);
	const AssemblySecureProxyAddr =  deploySecureProxyTx.events.find(x => x.eventName==="NewProxy")!.args.contractAddress;

	const basicProxy = erc20Factory.connect(wallet0,client,basic.getAddress());
	const SimpleProxy = erc20Factory.connect(wallet0,client,proxyRootSimple.getAddress());
	const AssemblySecureProxy = erc20Factory.connect(wallet0,client,AssemblySecureProxyAddr);

	const erc20Contracts = [
		{ label: "WITHOUT PROXY", contract: erc20 },
		{ label: "ZEPELLING PROXY", contract: basicProxy },
		{ label: "SIMPLE PROXY", contract: SimpleProxy },
		{ label: "SECURE PROXY", contract: AssemblySecureProxy },
	];


	console.log("\nMINT 10");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 10n ]);

	console.log("\nMINT 10 AGAIN");
	await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 10n ]);
	console.log(await erc20Contracts[ 2 ].contract.getView("balanceOf")([ wallet0Addr ]));

	console.log("\nTRANSFER PART:");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 10n ]);
	console.log("\nTRANSFER PART AGAIN:");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

	console.log("\nTRANSFER TOTAL");
	await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

	console.log("\n\nADMIN FUNCTIONS");
	
	const erc20_2 = await erc20Factory.deploy(wallet0,client,[]);
	const erc20_2Addr = erc20_2.getAddress();

	const proxyRootSimpleW1 = proxyRootSimple.connect(wallet1);
	const SecureProxyManagerW1 = SecureProxyManager.connect(wallet1);

	console.log("\nUPGRADETO");
	printGas(
		"SIMPLE PROXY",
		await proxyRootSimpleW1.getMethod("adminFunctionsPut").estimateGas([ 0,erc20_2Addr ]),
		(await proxyRootSimpleW1.getMethod("adminFunctionsPut").execute([ 0,erc20_2Addr ])).receipt
	);
	printGas(
		"SECURE PROXY",
		await SecureProxyManagerW1.getMethod("upgradeTo").estimateGas([ AssemblySecureProxyAddr,erc20_2Addr ]),
		(await SecureProxyManagerW1.getMethod("upgradeTo").execute([ AssemblySecureProxyAddr,erc20_2Addr ])).receipt
	);

	console.log("\nCHANGE ADMIN");
	printGas(
		"SIMPLE PROXY",
		await proxyRootSimpleW1.getMethod("adminFunctionsPut").estimateGas([ 1, wallet2Address ]),
		(await proxyRootSimpleW1.getMethod("adminFunctionsPut").execute([ 1, wallet2Address ])).receipt
	);
	printGas(
		"SECURE PROXY",
		await SecureProxyManagerW1.getMethod("changeAdmin").estimateGas([ AssemblySecureProxyAddr, wallet2Address ]),
		(await SecureProxyManagerW1.getMethod("changeAdmin").execute([ AssemblySecureProxyAddr, wallet2Address ])).receipt
	);


	const proxyRootSimpleW2 = proxyRootSimple.connect(wallet2);
	const SecureProxyManagerW2 = SecureProxyManager.connect(wallet2);

	console.log("\nUPGRADETO");
	printGas(
		"SIMPLE PROXY",
		await proxyRootSimpleW2.getMethod("adminFunctionsPut").estimateGas([ 0,erc20Addr ]),
		(await proxyRootSimpleW2.getMethod("adminFunctionsPut").execute([ 0,erc20Addr ])).receipt
	);
	printGas(
		"SECURE PROXY",
		await SecureProxyManagerW2.getMethod("upgradeTo").estimateGas([ AssemblySecureProxyAddr,erc20Addr ]),
		(await SecureProxyManagerW2.getMethod("upgradeTo").execute([ AssemblySecureProxyAddr,erc20Addr ])).receipt
	);

}
startAnvil(mnemonic).then(run).catch(console.error).finally(stopAnvil);
