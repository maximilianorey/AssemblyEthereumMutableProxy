import { Abi, AbiParameter } from "viem";

export type MapTypes = 
	{ key: "address", value: `0x${string}` } |
	{ key: "bool", value: boolean } |
	{ key: "string", value: string } |
	{ key: "function", value: `0x${string}` } |
	{ key: "bytes1", value: [number] } |
	{ key: "bytes2", value: [number,number] } |
	{ key: "bytes3", value: [number,number,number] } |
	{ key: "bytes4", value: [number,number,number,number] } |
	{ key: "bytes5", value: [number,number,number,number,number] } |
	{ key: "bytes6", value: [number,number,number,number,number,number] } |
	{ key: "bytes7", value: [number,number,number,number,number,number,number] } |
	{ key: "bytes8", value: [number,number,number,number,number,number,number,number] } |
	{ key: "bytes9", value: [number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes10", value: [number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes11", value: [number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes12", value: [number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes13", value: [number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes14", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes15", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes16", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes17", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes18", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes19", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes20", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes21", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes22", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes23", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes24", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes25", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes26", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes27", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes28", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes29", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes30", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes31", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: "bytes32", value: [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number] } |
	{ key: `${"u" | ""}int${number}`, value: bigint };


export  type ResolveType<TString extends string, M = MapTypes> = 
    M extends { key: infer Key, value: infer Val }
        ? TString extends Key ? Val : never 
        : never;

export  type MapInputsToTuple<TInputs extends readonly unknown[]> = {
    [K in keyof TInputs]: TInputs[K] extends { internalType: infer Type extends string }
        ? ResolveType<Type>
        : never;
};

export type JsonContract<
	TAbi extends Abi,
	Views extends { [name: string]: readonly AbiParameter[] }, 
	Functions extends { [name: string]: readonly AbiParameter[] },
	ConstructorInputs extends readonly AbiParameter[]
> = {
	abi: TAbi,
	views: Views,
	functions: Functions,
	constructor: ConstructorInputs,
	fromAssemblyConstructors?: Array<Array<{ index: number, size: number }>>
}


export type ResolveTypeArray<Arr extends readonly { type: string }[]> = {
  [K in keyof Arr]: ResolveType<Arr[K]["type"]>
};


export type InputsContructor<ConstructorInputs extends readonly AbiParameter[]> = ResolveTypeArray<ConstructorInputs>;

export function transforIntoBigInt(input: bigint | string | Array<number>): bigint{
	if(typeof input ==="bigint"){
		return input;
	}
	if(typeof input ==="string" && input.startsWith("0x")){
		return BigInt(input);
	}
	return BigInt(`0x${Buffer.from(input).toString("hex")}`);
}