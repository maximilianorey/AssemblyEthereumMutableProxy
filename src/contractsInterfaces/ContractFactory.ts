import { 
	Abi,
	ContractConstructorArgs,
	PublicClient, 
	UnionEvaluate, 
	WalletClient, 
} from "viem";

import { ContractInstance } from "./ContractInstance.js";
import { transforIntoBigInt } from "./utils.js";


function reeplaceOnBytecode(bytecode: `0x${string}`,args: Array<bigint>,fromAssemblyConstructors: readonly (readonly { index: number, size: number }[])[]): `0x${string}`{
	let res = bytecode;
	for(let i = 0;i<args.length;i++){
		const argsAsStr = args[ i ].toString(16);
		fromAssemblyConstructors[ i ].forEach(({ index, size }) =>{
			const fixedStr = argsAsStr.length < size*2 ? argsAsStr.padStart(size*2,"0") : argsAsStr.length===size*2 ? argsAsStr : argsAsStr.substring(argsAsStr.length-size*2);
			const begin = index*2+2;
			res = `0x${res.substring(2,begin)}${fixedStr}${res.substring(begin+size*2)}`;
		});
	}
	return res;
}

export class ContractFactory<
	TAbi extends Abi,
>{
	async deploy(
		walletClient: WalletClient,
		publicClient: PublicClient,
		args: UnionEvaluate<readonly [] extends ContractConstructorArgs<TAbi> ? ContractConstructorArgs<TAbi> | undefined : ContractConstructorArgs<TAbi>>,
	){
		const hash = this.fromAssemblyConstructors?.length 
			? await walletClient.deployContract({
				abi: this.abi.filter(x => x.type!=="constructor") as Abi,
				bytecode: reeplaceOnBytecode(this.bytecode,(args as Array<bigint | string | Array<number>>).map(transforIntoBigInt),this.fromAssemblyConstructors),
				args: [],
				account:  walletClient.account!,
				chain: null
			})
			: await walletClient.deployContract({
				abi: this.abi as Abi,
				bytecode: this.bytecode,
				args: args as Array<unknown>,
				account: walletClient.account!,
				chain: null
			});
			

		const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
		return new ContractInstance(walletClient,publicClient,receipt.contractAddress!,this.abi);
	}

	connect(walletClient: WalletClient, publicClient: PublicClient,contractAddress: `0x${string}`){
		return new ContractInstance(walletClient,publicClient,contractAddress,this.abi);
	}

	constructor(private abi: TAbi, private bytecode: `0x${string}`,private fromAssemblyConstructors?: readonly (readonly { index: number, size: number }[])[]){}
}

/*
const factory = new ContractFactory(BasicProxy.abi,BasicProxy.bytecode.object);



const test:ResolveTypeArray<[{type: "address"},{type: "bytes2"},{type: "string"}]> = [
	"0x18",
	[ 12,12 ],
	"HELLO",
	"ddd"
];

const test:ResolveTypeArray<typeof BasicProxy["constructor"]> = [
	"0x18",
	"0x18",
];

const params: DeployContractParameters<TAbi, undefined, undefined, undefined>{

}*/