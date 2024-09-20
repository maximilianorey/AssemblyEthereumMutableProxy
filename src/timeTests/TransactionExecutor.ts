import type { ContractMethodArgs, HDNodeWallet, Typed } from "ethers";
import { TypedContractMethod } from "../typechain/common";
import { BasicUpgradeable, ERC20Imp } from "../typechain";

export class TransactionExecutor{
	private contracts: Array<{name: string, contract: ERC20Imp | BasicUpgradeable}>;
	private wallet: HDNodeWallet;
	private callback: (log: string) => void;

	constructor(wallet: HDNodeWallet, callback: (log: string) => void, contracts: Array<{name: string, contract: ERC20Imp | BasicUpgradeable}>){
		this.contracts = contracts;
		this.wallet = wallet;
		this.callback = callback;
	}

	async estimateGasAndExecuteMethod<A extends Array<unknown>>(method: TypedContractMethod<A>, ...params: { [ I in keyof A ]-?: A[I] | Typed }) {
		const paramsWithNonce: ContractMethodArgs<A> = [ ...params, { nonce: await this.wallet.getNonce() } ];
		const estimated = (await method.estimateGas(...paramsWithNonce)).toString();
		
		const transaction = await (await method(...paramsWithNonce)).wait();
		if(!transaction){
			throw new Error(`Error processing transaction: '${method.name}' with params: ${JSON.stringify(params)}`);
		}
		this.callback(`\tGAS ESTIMATED: ${estimated}\tGAS USED: ${transaction.gasUsed}`);
	};

	estimateGasAndExecute<A extends Array<unknown>>(methodGetter: (contract: ERC20Imp | BasicUpgradeable) => TypedContractMethod<A>, ...params: { [ I in keyof A ]-?: A[I] | Typed }) {
		return this.contracts.reduce(async (acum,{ name,contract }) => {
			await acum;
			this.callback(`\n\t${name}`);
			return this.estimateGasAndExecuteMethod(methodGetter(contract), ...params);
		}, Promise.resolve());
	};
}