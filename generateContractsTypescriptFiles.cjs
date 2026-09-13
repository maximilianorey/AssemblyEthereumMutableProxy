const fs = require("fs");

fs.readdirSync("./src/out").forEach(name => {
	if(name.endsWith(".sol")){
		fs.readdirSync(`./src/out/${name}`).forEach(fileName => {
			if(fileName.endsWith(".json")){
				const jsonName = fileName.substring(0,
					fileName.length-5);
				const file = JSON.parse(
					fs.readFileSync(`./src/out/${name}/${jsonName}.json`).toString()
				);

				const views = {};
				const functions = {};
				file.abi.forEach(x => {
					if(x.type==="function"){
						if(x.stateMutability==="view" || x.stateMutability==="pure"){
							views[ x.name ] = x.inputs;
						}else{
							functions[ x.name ] = x.inputs;
						}
					}
				});

				fs.writeFileSync(`./src/out/${name}/${jsonName}.ts`,
					`export default ${JSON.stringify(
						{
							...file,
							views,
							functions,
							constructor: file.abi.find(x => x.type==="constructor")?.inputs || []
						},
						undefined,
						"\t"
					)} as const;`
				);
			}
		});
	}

});