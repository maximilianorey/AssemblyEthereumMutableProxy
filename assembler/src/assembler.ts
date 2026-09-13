import fs from "fs";

import { assembly, fromTemplate } from "./libs/assembler";

function errorMessage(){
	console.error("--RAW_OUTPUT <input_file>");
	console.error("--FROM_TEMPLATE <input_file> <template_file> <output_file>");
	console.error("--FROM_JSON <input_file> <template_file> <output_file>");
	process.exit(1);
}

if(process.argv.length<3){
	errorMessage();
}

const res = assembly(process.argv[ 3 ]);
if(res.isError){
	console.error(`On line: ${res.line}`);
	console.error(res.message);
	if(res.cause){
		console.error(res.cause);
	}
	process.exit(1);
}else{
	switch(process.argv[ 2 ]){
	case "--RAW_OUTPUT":
		console.log(`0x${res.binaryCode}`);
		console.log(res.params);
		break;
	case "--FROM_TEMPLATE":
		if(process.argv.length<6){
			errorMessage();
		}
		{
			const error = fromTemplate(res,process.argv[ 4 ],process.argv[ 5 ]);
			if(error){
				console.error(error);
				process.exit(1);
			}
		}
		break;
	case "--FROM_JSON":
		if(process.argv.length<6){
			errorMessage();
		}
		{
			const json = JSON.parse(fs.readFileSync(process.argv[ 4 ]).toString());
			res.params.delete("LENGTH");
			json.bytecode.object = `0x${res.binaryCode}`;
			const constructorObject = {
				type: "constructor",
				inputs: [ ...res.params.keys() ].map(name => ({
					type: "address",
					name,
					internalType: "address"
				  })),
				stateMutability: "nonpayable"
			};
			json.abi.push(constructorObject);
			json.metadata.output.abi.push(constructorObject);
			fs.writeFileSync(
				process.argv[ 5 ],
				JSON.stringify(
					{
						...json,
						fromAssemblyConstructors: [ ...res.params.values() ].map(x => x.map(index => ({ index, size: 32 })))
					}
					,
					undefined,
					"\t"
				)
			);
		}
		break;
	default:
		errorMessage();
	}

	
}