import { generateMnemonic } from "bip39";
import { Abi, ContractFunctionExecutionError, ContractFunctionRevertedError, createPublicClient, createWalletClient, http, PublicClient, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { hdkey } from "@ethereumjs/wallet";

import { ContractFactory } from "../src/contractsInterfaces/ContractFactory.js";
import { ContractInstance } from "../src/contractsInterfaces/ContractInstance.js";
import AssemblySimpleProxyJson from "../src/out/AssemblySimpleProxy.sol/AssemblySimpleProxy.js";
import AssemblySecureProxyJson from "../src/out/AssenblySecureProxy.sol/AssemblySecureProxy.js";
import SlotOverriterJson from "../src/out/SlotOverriter.sol/SlotOverriter.js";

import SecureProxyManagerJson from "../src/out/SecureProxyManager.sol/SecureProxyManager.js";
import Erc20Json from "../src/out/ERC20Imp.sol/ERC20Imp.js";

import { startAnvil, stopAnvil } from "../src/utils/anvil.js";

async function contractReject(func: () => unknown | Promise<unknown>): Promise<ContractFunctionRevertedError>{
	try {
		await func();
	} catch (error) {
		expect(error).toBeInstanceOf(ContractFunctionExecutionError);
		const castedError = error as ContractFunctionExecutionError;
		expect(castedError.cause).toBeInstanceOf(ContractFunctionRevertedError);
		return castedError.cause as ContractFunctionRevertedError;
	}
	fail("Function should fail");

}

function mapToPayable(abi: Abi): Abi{
	return abi.map(x => x.type==="function" ? {
		...x,
		stateMutability: "payable"
	}: x);
}

function importFunctions(abi1: Abi, abi2: Abi): Abi{
	const res = [ ...abi1 ];
	abi2.forEach(entry => {
		if(entry.type==="function" && !abi1.find(x => x.type==="function" && x.name===entry.name)){
			res.push(entry);
		}
	});
	return res;
}

describe("TEST CUSTOM ERRORS", function (){
	const mnemonic = generateMnemonic();
	let walletAddr: `0x${string}` = "0x";
	let erc20: ContractInstance<typeof Erc20Json.abi>;
	let wallet: WalletClient;
	let client: PublicClient;
	beforeAll(async () => {
		
		await startAnvil(mnemonic);


		const ethHdKey = hdkey.EthereumHDKey.fromMnemonic(mnemonic);
		wallet = createWalletClient({
			account: privateKeyToAccount(`0x${Buffer.from(ethHdKey.derivePath("m/44'/60'/0'/0/0").getWallet().getPrivateKey()).toString("hex")}`),
			chain: foundry,
			transport: http("http://127.0.0.1:8545"),
		});
		client = createPublicClient({
			chain: foundry,
			transport: http("http://127.0.0.1:8545"),
		});
		walletAddr = (await wallet.getAddresses())[ 0 ];
		erc20 = await new ContractFactory(Erc20Json.abi, Erc20Json.bytecode.object).deploy(wallet,client,[]);
	});

	afterAll(() => {
		stopAnvil();
	});

	describe("SimpleProxy", function (){
		let proxy: ContractInstance<typeof AssemblySimpleProxyJson.abi>;
		beforeAll(async () => {
			proxy = await new ContractFactory(AssemblySimpleProxyJson.abi,AssemblySimpleProxyJson.bytecode.object,AssemblySimpleProxyJson.fromAssemblyConstructors).deploy(wallet,client,[
				walletAddr,
				erc20.getAddress()
			]);
		});
		
			
		it("Should throw error if address implementation is not a contract", async() => {
			const errorMessage = await contractReject(() => proxy.getMethod("adminFunctionsPut").execute([ 0, "0x0000000000000000000000000000000000000001" ]));
			expect(errorMessage.metaMessages && errorMessage?.metaMessages[ 0 ]).toBe("Error: AddressIsNotAContract(address implementation)");
			expect(errorMessage.data?.args).toEqual([ "0x0000000000000000000000000000000000000001" ]);
		});

		it("Should throw error if try to send payment to a function", async() => {
			const payableInstance = new ContractInstance(wallet,client,proxy.getAddress(),mapToPayable(AssemblySimpleProxyJson.abi));

			const errorMessage1 = await contractReject(() => payableInstance.getMethod("adminFunctionsPut").execute([ 1,"0x0000000000000000000000000000000000000001" ],20n));
			expect(errorMessage1.metaMessages && errorMessage1.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage1.data).toBeDefined();
			expect(errorMessage1.data?.args?.length || 0).toBe(0);
			const errorMessage2 = await contractReject(() => payableInstance.getMethod("implementation").execute([],20n));
			expect(errorMessage2.metaMessages && errorMessage2.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage2.data).toBeDefined();
			expect(errorMessage2.data?.args?.length || 0).toBe(0);

			const errorMessage3 = await contractReject(() => payableInstance.getMethod("adminFunctionsPut").execute([ 0,erc20.getAddress() ],20n));
			expect(errorMessage3.metaMessages && errorMessage3.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage3.data).toBeDefined();
			expect(errorMessage3.data?.args?.length || 0).toBe(0);
			
		});
	});

	describe("SecureProxy", function (){
		let manager: ContractInstance<typeof SecureProxyManagerJson.abi>;
		beforeAll(async () => {
			manager = await new ContractFactory(SecureProxyManagerJson.abi,SecureProxyManagerJson.bytecode.object,SecureProxyManagerJson.fromAssemblyConstructors).deploy(wallet,client,[]);
			
		});
		
			
		it("Should throw error if address implementation is not a contract", async() => {
			const newProxyTransaction = await manager.getMethod("deployProxy").execute([ 
				walletAddr,
				erc20.getAddress() 
			]);
			
			const newProxyAddress = newProxyTransaction.events.find(x => x.eventName==="NewProxy")?.args.contractAddress;
			expect(newProxyAddress).toBeDefined();
			const proxy = new ContractInstance(wallet,client,newProxyAddress!,AssemblySecureProxyJson.abi);

			const errorMessage = await contractReject(() => manager.getMethod("upgradeTo").execute([ proxy.getAddress(), "0x0000000000000000000000000000000000000001" ]));
			expect(errorMessage.metaMessages && errorMessage?.metaMessages[ 0 ]).toBe("Error: AddressIsNotAContract(address implementation)");
			expect(errorMessage.data?.args).toEqual([ "0x0000000000000000000000000000000000000001" ]);
		});

		it("Should throw error if try to send payment to a function", async() => {
			const newProxyTransaction = await manager.getMethod("deployProxy").execute([ 
				walletAddr,
				erc20.getAddress() 
			]);
			const newProxyAddress = newProxyTransaction.events.find(x => x.eventName==="NewProxy")?.args.contractAddress;
			expect(newProxyAddress).toBeDefined();

			const payableInstance = new ContractInstance(wallet,client,manager.getAddress(),mapToPayable(SecureProxyManagerJson.abi));

			const errorMessage1 = await contractReject(() => payableInstance.getMethod("changeAdmin").execute([ newProxyAddress!,"0x0000000000000000000000000000000000000001" ],20n));
			expect(errorMessage1.metaMessages && errorMessage1.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage1.data).toBeDefined();
			expect(errorMessage1.data?.args?.length || 0).toBe(0);

			const errorMessage2 = await contractReject(() => payableInstance.getMethod("upgradeTo").execute([ newProxyAddress!,erc20.getAddress() ],20n));
			expect(errorMessage2.metaMessages && errorMessage2.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage2.data).toBeDefined();
			expect(errorMessage2.data?.args?.length || 0).toBe(0);

			const errorMessage3 = await contractReject(() => payableInstance.getMethod("deployProxy").execute([ walletAddr,erc20.getAddress() ],20n));
			expect(errorMessage3.metaMessages && errorMessage3.metaMessages[ 0 ]).toBe("Error: NotPaymentAllowed()");
			expect(errorMessage3.data).toBeDefined();
			expect(errorMessage3.data?.args?.length || 0).toBe(0);
		});

		it("Should throw error if implementation try to override slot", async() => {
			const overriterInstance = await new ContractFactory(SlotOverriterJson.abi,SlotOverriterJson.bytecode.object).deploy(wallet,client,[]);
			const newProxyTransaction = await manager.getMethod("deployProxy").execute([ 
				walletAddr,
				overriterInstance.getAddress()
			]);
			const newProxyAddress = newProxyTransaction.events.find(x => x.eventName==="NewProxy")?.args.contractAddress;
			expect(newProxyAddress).toBeDefined();
			const proxy = new ContractInstance(
				wallet,
				client,
				newProxyAddress!,
				importFunctions(AssemblySecureProxyJson.abi,SlotOverriterJson.abi)
			);

			const errorMessage = await contractReject(() => proxy.getMethod("tryToCorruptProxyImplmentation").execute([ erc20.getAddress() ]));
			expect(errorMessage.metaMessages && errorMessage?.metaMessages[ 0 ]).toBe("Error: CorruptedRegisters()");
			expect(errorMessage.data).toBeDefined();
			expect(errorMessage.data?.args?.length || 0).toBe(0);
		});
	});
});