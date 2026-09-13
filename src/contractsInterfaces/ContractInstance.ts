import { 
	type PublicClient, 
	type WalletClient, 
	parseEventLogs,
	ParseEventLogsReturnType,
	TransactionReceipt,
	Abi,
	ContractFunctionArgs,
	ContractFunctionName,
	EstimateGasReturnType,
	parseEther
} from "viem";


export class ContractInstance<
  TAbi extends Abi,
>{
	getMethod<P extends ("nonpayable" | "payable"),FName extends ContractFunctionName<TAbi,P>>(name: FName) {
		return {
			execute: async (
				args: ContractFunctionArgs<TAbi,P,FName>,
				value?: P extends "payable" ? `${number}` : undefined
			): Promise<{ receipt: TransactionReceipt,events: ParseEventLogsReturnType<TAbi,undefined,true> }> => {
				const executionsArgs = {
					abi: this.abi as Abi,
					functionName: name,
					address: this.contractAddress,
					chain: this.walletClient.chain,
					account: this.walletClient.account!,
					args: args as Array<unknown>
				} as const;

				if(value){
					Object.assign(executionsArgs,{ value: parseEther(value) });
				}

				await this.publicClient.simulateContract(executionsArgs);

				const hash = await this.walletClient.writeContract(executionsArgs);
      
				const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

				const events = parseEventLogs({
					abi: this.abi,
					logs: receipt.logs,
				});

				return { receipt, events };
			},
			estimateGas: async (
				args: ContractFunctionArgs<TAbi,"nonpayable" | "payable",FName>
			): Promise<EstimateGasReturnType> => {
				const executionsArgs = {
					abi: this.abi,
					functionName: name,
					address: this.contractAddress,
					chain: this.walletClient.chain,
					account: this.walletClient.account!,
					args
				} as const;

				return this.publicClient.estimateGas(executionsArgs);
			}
		};
	}

	getView<FName extends ContractFunctionName<TAbi,"pure" | "view">>(name: FName) {
		return (
			args: ContractFunctionArgs<TAbi,"pure" | "view",FName>
		) => {
			return this.publicClient.readContract({
				abi: this.abi,
				functionName: name,
				address: this.contractAddress,
				account: this.walletClient.account!,
				args
			});
		};
	}

	getAddress(){
		return this.contractAddress;
	}

	connect(newWalletClient: WalletClient): ContractInstance<TAbi>{
		return new ContractInstance(newWalletClient,this.publicClient,this.contractAddress,this.abi);
	}

	constructor(private walletClient: WalletClient, private publicClient: PublicClient, private contractAddress: `0x${string}`, private abi: TAbi){}
}

