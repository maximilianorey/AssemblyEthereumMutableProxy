import type { ContractMethodArgs, HDNodeWallet, Typed } from "ethers";
import { TypedContractMethod } from "../typechain/common";
import { sleep } from "../utils/utils";

export class TransactionExecutor<T>{
	private contracts: Array<{name: string, contract: T }>;
	private wallet: HDNodeWallet;
	private callback: (log: string) => void;


	constructor(wallet: HDNodeWallet, callback: (log: string) => void, contracts: Array<{name: string, contract: T }>){
		this.contracts = contracts;
		this.wallet = wallet;
		this.callback = callback;
	}

	async estimateGasAndExecuteMethod<A extends Array<unknown>>(name: string, method: TypedContractMethod<A>, extra: {params: { [ I in keyof A ]-?: A[I] | Typed }, wallet?: HDNodeWallet}) {
		await sleep(500);
		this.callback(`\n\t${name}`);
		const paramsWithNonce: ContractMethodArgs<A> = [ ...extra.params, { nonce: await (extra.wallet ? extra.wallet.getNonce() : this.wallet.getNonce()) } ];
		const estimated = (await method.estimateGas(...paramsWithNonce)).toString();
		
		const transaction = await (await method(...paramsWithNonce)).wait();
		if(!transaction){
			throw new Error(`Error processing transaction: '${method.name}' with params: ${JSON.stringify(extra.params)}`);
		}
		this.callback(`\tGAS ESTIMATED: ${estimated}\tGAS USED: ${transaction.gasUsed}`);
	}

	estimateGasAndExecute<A extends Array<unknown>>(methodGetter: (contract: T ) => TypedContractMethod<A>, ...params: { [ I in keyof A ]-?: A[I] | Typed }) {
		return this.contracts.reduce(async (acum,{ name,contract }) => {
			await acum;
			return this.estimateGasAndExecuteMethod(name, methodGetter(contract), { params });
		}, Promise.resolve());
	};
}