import { assembly, fromTemplate } from "./libs/assembler";

function errorMessage(){
	console.error("--RAW_OUTPUT <input_file>");
	console.error("--FROM_TEMPLATE <input_file> <template_file> <output_file>");
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
	default:
		errorMessage();
	}

	
}