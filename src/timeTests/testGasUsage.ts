import dotenv from "dotenv";
import fs from "fs";
import { createWalletClient, createPublicClient, EstimateGasReturnType, WaitForTransactionReceiptReturnType, Chain, ContractFunctionArgs, ContractFunctionName, http } from "viem";
import { hdkey } from "@ethereumjs/wallet";
import { privateKeyToAccount } from "viem/accounts";

import SimpleProxyJson from "../out/AssemblySimpleProxy.sol/AssemblySimpleProxy.js";
import SecureProxyManagerJson from "../out/SecureProxyManager.sol/SecureProxyManager.js";
import Erc20Json from "../out/ERC20Imp.sol/ERC20Imp.js";
import Erc20_2Json from "../out/ERC20Imp_2.sol/ERC20Imp_2.js";
import BasicProxyJson from "../out/BasicProxy.sol/BasicProxy.js";
import { ContractFactory } from "../contractsInterfaces/ContractFactory.js";
import { ContractInstance } from "../contractsInterfaces/ContractInstance.js";

dotenv.config({ path: "./.env" });

function printGas<chain extends Chain | undefined>(label: string,gasEstimated: EstimateGasReturnType,receipt: WaitForTransactionReceiptReturnType<chain>){
	return `\t${label}:\tGAS ESTIMATED: ${gasEstimated.toString()}\tGAS USED: ${receipt.gasUsed}`;
}

async function printGasForErc20<FName extends ContractFunctionName<typeof Erc20Json["abi"],"nonpayable" | "payable">>(
	contracts: Array<{ label: string, contract: ContractInstance<typeof Erc20Json["abi"]> }>,
	method: FName,
	args: ContractFunctionArgs<typeof Erc20Json["abi"],"nonpayable" | "payable",FName>
){
	let logs = "";
	await contracts.reduce(async (acum,{ label,contract }) => {
		await acum;
		logs += `\n\t${label}:\tGAS ESTIMATED: ${(await contract.getMethod(method).estimateGas(args)).toString()}\tGAS USED: ${(await contract.getMethod(method).execute(args)).receipt.gasUsed}`;
	},Promise.resolve());
	return logs;
}

async function runOne(name: string, mnemonic: string, nodeUrl: string) {
	let res = `RESULTS FOR '${name}':`;
	try{
		const ethHdKey = hdkey.EthereumHDKey.fromMnemonic(mnemonic);
		
		const wallet0 = createWalletClient({
			account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/0").getWallet().getPrivateKey()).toString("hex")}`),
			transport: http(nodeUrl),
		});
		const wallet1 = createWalletClient({
			account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/1").getWallet().getPrivateKey()).toString("hex")}`),
			transport: http(nodeUrl)
		});
		const wallet2 = createWalletClient({
			account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/2").getWallet().getPrivateKey()).toString("hex")}`),
			transport: http(nodeUrl)
		});

		const [ wallet0Addr ] = await wallet0.getAddresses();
		const [ wallet1Addr ] = await wallet1.getAddresses();
		const [ wallet2Address ] = await wallet2.getAddresses();

		const publicClient = createPublicClient({
			transport: http(nodeUrl),
		});

		res += "\nDEPLOYING ERC20";
		const erc20Factory = new ContractFactory(Erc20Json.abi,Erc20Json.bytecode.object);
		const erc20 = await erc20Factory.deploy(wallet0,publicClient,[]);
		const erc20Addr = erc20.getAddress();

		res += "\nDEPLOYING BASIC PROXY";
		const basic = await new ContractFactory(BasicProxyJson.abi,BasicProxyJson.bytecode.object).deploy(
			wallet0,
			publicClient,
			[
				wallet1Addr,
				erc20Addr
			]
		);

		res += "\nDEPLOYING PROXY SIMPLE";
		const proxyRootSimple = await new ContractFactory(SimpleProxyJson.abi,SimpleProxyJson.bytecode.object,SimpleProxyJson.fromAssemblyConstructors).deploy(wallet0,publicClient,[ wallet1Addr, erc20Addr ]);

		res += "\nDEPLOYING SECURE PROXY MANAGER";
		const SecureProxyManager = await new ContractFactory(SecureProxyManagerJson.abi,SecureProxyManagerJson.bytecode.object,SecureProxyManagerJson.fromAssemblyConstructors).deploy(wallet0,publicClient,[]);
		const deploySecureProxyTx = await SecureProxyManager.getMethod("deployProxy").execute([ wallet1Addr,erc20Addr ]);
		const AssemblySecureProxyAddr =  deploySecureProxyTx.events.find(x => x.eventName==="NewProxy")!.args.contractAddress;

		const basicProxy =  erc20Factory.connect(wallet0, publicClient, basic.getAddress());
		const SimpleProxy = erc20Factory.connect(wallet0, publicClient, proxyRootSimple.getAddress());
		const AssemblySecureProxy = erc20Factory.connect(wallet0, publicClient, AssemblySecureProxyAddr);
	
		const erc20Contracts = [
			{ label: "WITHOUT PROXY", contract: erc20 },
			{ label: "ZEPELLING PROXY", contract: basicProxy },
			{ label: "PROXY SIMPLE", contract: SimpleProxy },
			{ label: "SECURE PROXY", contract: AssemblySecureProxy },
		];

		res += "\nMINT 10";
		res += await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 10n ]);

		res += "\nMINT 10 AGAIN";
		res += await printGasForErc20(erc20Contracts,"mint",[ wallet0Addr, 10n ]);

		res += "\nTRANSFER PART:";
		res += await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 10n ]);

		res += "\nTRANSFER PART AGAIN:";
		res += await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

		res += "\nTRANSFER TOTAL";
		res += await printGasForErc20(erc20Contracts,"transfer",[ "0x0000000000000000000000000000000000000001", 5n ]);

		res += "\n\nADMIN FUNCTIONS";
		const erc20_2 = await new ContractFactory(Erc20_2Json.abi,Erc20_2Json.bytecode.object).deploy(wallet0,publicClient,[]);
		const erc20_2Addr = erc20_2.getAddress();

		const proxyRootSimpleW1 = proxyRootSimple.connect(wallet1);
		const SecureProxyManagerW1 = SecureProxyManager.connect(wallet1);

		res += "\nUPGRADETO";
		res += printGas(
			"PROXY SIMPLE",
			await proxyRootSimpleW1.getMethod("adminFunctionsPut").estimateGas([ 0,erc20_2Addr ]),
			(await proxyRootSimpleW1.getMethod("adminFunctionsPut").execute([ 0,erc20_2Addr ])).receipt
		);
		res += printGas(
			"SECURE PROXY",
			await SecureProxyManagerW1.getMethod("upgradeTo").estimateGas([ AssemblySecureProxyAddr,erc20_2Addr ]),
			(await SecureProxyManagerW1.getMethod("upgradeTo").execute([ AssemblySecureProxyAddr,erc20_2Addr ])).receipt
		);

		res += "\nCHANGE ADMIN";
		res += printGas(
			"PROXY SIMPLE",
			await proxyRootSimpleW1.getMethod("adminFunctionsPut").estimateGas([ 1, wallet2Address ]),
			(await proxyRootSimpleW1.getMethod("adminFunctionsPut").execute([ 1, wallet2Address ])).receipt
		);
		res += printGas(
			"SECURE PROXY",
			await SecureProxyManagerW1.getMethod("changeAdmin").estimateGas([ AssemblySecureProxyAddr, wallet2Address ]),
			(await SecureProxyManagerW1.getMethod("changeAdmin").execute([ AssemblySecureProxyAddr, wallet2Address ])).receipt
		);

		const proxyRootSimpleW2 = proxyRootSimple.connect(wallet2);
		const SecureProxyManagerW2 = SecureProxyManager.connect(wallet2);

		res += "\nUPGRADETO";
		res += printGas(
			"PROXY SIMPLE",
			await proxyRootSimpleW2.getMethod("adminFunctionsPut").estimateGas([ 0,erc20Addr ]),
			(await proxyRootSimpleW2.getMethod("adminFunctionsPut").execute([ 0,erc20Addr ])).receipt
		);
		res += printGas(
			"SECURE PROXY",
			await SecureProxyManagerW2.getMethod("upgradeTo").estimateGas([ AssemblySecureProxyAddr,erc20Addr ]),
			(await SecureProxyManagerW2.getMethod("upgradeTo").execute([ AssemblySecureProxyAddr,erc20Addr ])).receipt
		);

		console.log(res);
	}catch(err){
		if(err instanceof String){
			throw `ERROR FOR ${name}:\ncompute until:\n${res}\nError:\n` + err;
		}
		if(err instanceof Error){
			err.message = `ERROR FOR ${name}:\ncompute until:\n${res}\nError:\n${err.message}`;
		}
		throw err;
	}
}

function run() {
	const mnemonic = process.env.mnemonic;
	if(!mnemonic){
		console.error("MNEMONIC NOT SET ON ENVIRONMENT (.env file)");
		process.exit(1);
	}

	const blockchains: Array<{ name, nodeUrl }> = JSON.parse(fs.readFileSync("./testnets.json").toString());

	return Promise.all(blockchains.map(({ name, nodeUrl }) => runOne(name,mnemonic,nodeUrl).catch(console.error)));
}

run().catch(console.error);