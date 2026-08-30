import fs from "fs";

import { opcodes } from "./opcodes";
import { generateError } from "./ethErrors";
import { dirname } from "path";

export type NotImportIndexType = {isImport: false, index: number};
export type ImportIndexType = {isImport: true, index:number,data: AssemblyReturn};
export type IndexType = NotImportIndexType | ImportIndexType;

export type Labels = {
    isError: false,
    constructorSize: number,
    bodySize: number,
    size: number,
    constructorLabels: Map<string,IndexType>
    bodyLabels: Map<string,IndexType>,
	params: Map<string,Array<number>>,
	errors: Map<string,string>,
}

export type AssemblyError = {
    isError: true,
	message: string,
	line: number,
	cause?: unknown,
}

export type AssemblyReturn = {
	isError: false,
	binaryCode: string,
	params: Map<string,Array<number>>,
}

function processPushAttr(rawAttrs: string,labels: Labels,mapLabels: Map<string, IndexType>,contructorLength: number): {isError: false, index: bigint} | {isError: true, message: string}{
	if(rawAttrs.startsWith("-")){
		return { isError: false, index: BigInt(0) };
	}


	return rawAttrs.split("+").reduce<{isError: false, index: bigint} | {isError: true, message: string}>((acum,rawAttr) => {
		if(acum.isError){
			return acum;
		}
		if(rawAttr.startsWith(".")){
			const [ ,section,label,extra1,extra2 ] = rawAttr.split(".");

			let labelData: IndexType | undefined;
			let index = 0;
			switch(section){
			case "CONSTRUCTOR":
				labelData = labels.constructorLabels.get(label);
				break;
			case "THIS":
				labelData = mapLabels.get(label);
				break;
			case "FROMBEGINNING":
				index = contructorLength;
				labelData = labels.bodyLabels.get(label);
				break;
			case "BODY":
				labelData = labels.bodyLabels.get(label);
				break;

			default:
				return {
					isError: true,
					message: `Section '${section}' not found`,
				};

			}

			if(!labelData){
				return {
					isError: true,
					message: `Label '${label}' not found on section '${section}'`,
				};
			}

					
			if(labelData.isImport && extra1){
				const subindex = labelData.data.params.get(extra1);
				if(!subindex){
					return {
						isError: true,
						message: `Parameter '${extra1}' not found on file '${label}' (section: '${section}')`,
					};
				}
				if(!/^[0-9]+$/.test(extra2)){
					return {
						isError: true,
						message: `Last parameter should be a number. Founded '${extra2}'`,
					};
				}
				const selector = Number.parseInt(extra2,10);
				if(selector >= subindex.length){
					return {
						isError: true,
						message: `Parameter '${extra1}' on file '${label}' (section: '${section}') has ${subindex.length} positions indexes. Index requested ${selector}`,
					};
				}
				index += subindex[ selector ];

			}else{
				index += labelData.index;
			}

			return { isError: false, index: BigInt(index) + acum.index };
		}
		if(/^[0-9]+$/.test(rawAttr) || (rawAttr.startsWith("0X") && /^([0-9]|[A-F])+$/.test(rawAttr.substring(2)))){
			return { isError: false, index: BigInt(rawAttr) + acum.index };
		}
	
		return { isError: true, message: `NOT RECOGNIZED: '${rawAttr}'` };
	},{ isError: false, index: BigInt(0) });
	
	
}

export function calculateLabelsPositions(lines: Array<string>, path: string): Labels | AssemblyError{
	let constructorLabels: Map<string,IndexType> = new Map();
	let labels: Map<string,IndexType> = new Map();
	let lineNumber = 1;
	let constructorSize = 0;
	let index = 0;
	const params: Map<string,Array<number>> = new Map();
	const errors: Map<string,string> = new Map();
	for(let i = 0;i<lines.length;i++){
		const line = lines[ i ];
		if(line.length){
			if(line==="BODY:"){
				constructorLabels = labels;
				constructorLabels.set("LENGTH",{ isImport: false, index });
				labels = new Map();
				constructorSize = index;
				index = 0;
			}else if(line.startsWith(".") && line.endsWith(":")){
				labels.set(line.substring(1,line.length-1),{ isImport: false, index });
			}else if(line.startsWith("<ERROR>")){
				const errorText = line.substring(7);
				const errorGenerated = generateError(errorText,index,true);
				errors.set(errorText,errorGenerated);
				index += errorGenerated.length/2;
			}else if(line.startsWith("<IMPORT> ")){
				const [ ,subFilePath,alias ] = line.split(" ");
				const importedFile = assembly(subFilePath.startsWith("/") ? subFilePath : `${dirname(path)}/${subFilePath}`);
				if(importedFile.isError){
					return importedFile;
				}
				labels.set(alias,{ isImport: true, index, data: importedFile });
				index += importedFile.binaryCode.length/2;
			}else{
				index += 1;
				const splited = line.split(" ");
				if(!opcodes.has(splited[ 0 ])){
					return { isError: true, message:`Invalid instruction: '${splited[ 0 ]}'`,line: lineNumber };
				}
				if(splited[ 0 ].startsWith("PUSH")){
					if(splited.length!==2){
						return { isError: true, message:`Expect '${splited[ 0 ]}' to have one attribute. Founded: ${splited.length-1}`,line: lineNumber };
					}
					if(splited[ 1 ].startsWith("-")){
						const paramName = splited[ 1 ].substring(1);
						const paramValue = params.get(paramName);
						const finalIndex = index + constructorSize;
						if(paramValue){
							paramValue.push(finalIndex);
						}else{
							params.set(paramName,[ finalIndex ]);
						}

					}
					const pushSize = Number.parseInt(splited[ 0 ].substring(4),10);
					index += pushSize;
				}else if(splited.length!==1){
					return { isError: true, message:`Label '${splited[ 0 ]}' to have zero attributes. Founded: ${splited.length-1}`,line: lineNumber };
				}
			}
		}
		lineNumber += 1;
	}
	labels.set("LENGTH",{ isImport: false, index });
	params.set("LENGTH",[ constructorSize + index ]);
	return {
		isError: false,
		constructorSize,
		bodySize: index,
		size: constructorSize + index,
		constructorLabels,
		bodyLabels: labels,
		params,
		errors,
	};
}

export function build(lines: Array<string>, labels: Labels): AssemblyReturn | AssemblyError{
	const res: Array<string> = [];
	let mapLabels: Map<string,IndexType> = labels.constructorLabels;
	let lineNumber = 1;
	const contructorLength = labels.constructorLabels.get("LENGTH")!.index;
	for(let i = 0;i<lines.length;i++){
		const line = lines[ i ];
		const splited = line.split(" ");
		const code = opcodes.get(splited[ 0 ]);
		if(line==="BODY:"){
			mapLabels = labels.bodyLabels;
		}else if(line.startsWith("<ERROR>")){
			const errorText = line.substring(7);
			const errorGenerated = labels.errors.get(errorText);
			if(!errorGenerated){
				throw new Error(`ERROR NOT FOUND: '${errorText}'`);
			}
			res.push(errorGenerated);
		}else if(line.startsWith("<IMPORT> ")){
			const [ ,,alias ] = line.split(" ");
			const { data } = mapLabels.get(alias) as ImportIndexType;
			res.push(data.binaryCode);
		} else if(code!==undefined){
			res.push(code.toString(16).padStart(2,"0"));
			const rawAttr = splited[ 1 ];
			if(splited[ 0 ].startsWith("PUSH")){
				const pushSize = Number.parseInt(splited[ 0 ].substring(4),10);
				const processPushAttrResult = processPushAttr(rawAttr,labels,mapLabels,contructorLength);
				if(processPushAttrResult.isError){
					return {
						isError: true,
						message: processPushAttrResult.message,
						line: lineNumber,
					};
				}
				const attr = processPushAttrResult.index.toString(16).padStart(pushSize*2,"0");
				if(attr.length > pushSize*2){
					return {
						isError: true,
						line: lineNumber,
						message: `Parameter: '${attr}' to big for push size.`
					};
				}
				res.push(attr);

			}
		}else if(line.length!==0 && (!line.startsWith(".") || !line.endsWith(":"))){
			return {
				isError: true,
				message: `Invalid line: '${line}'`,
				line: lineNumber
			};
		}
		lineNumber += 1;
	}
	return { isError: false, binaryCode: res.join("").toUpperCase(), params: labels.params };
}

export function assembly(path: string): AssemblyReturn | AssemblyError{
	const file = fs.readFileSync(path).toString();
	const lines = file.split("\n").map(x => {
		const line = x.split("//",1)[ 0 ].trim();
		if(line.startsWith("<IMPORT> ") || line.startsWith("<import> ")) {
			const params = line.split(" ");
			params[ 0 ] = params[ 0 ].toUpperCase();
			for(let i = 2;i<params.length;i++){
				params[ i ] = params[ i ].toUpperCase();
			}
			return params.join(" ");
		}
		if(line.startsWith("<ERROR>")){
			return line;
		}
		return line.toUpperCase();
	});

	const labels = calculateLabelsPositions(lines,path);
	if(labels.isError){
		labels.message = `ON FILE: '${path}': ${labels.message}`;
		return labels;
	}
	const res = build(lines,labels);
	if(res.isError){
		res.message = `ON FILE: '${path}': ${res.message}`;
	}
	return res;
}

export function fromTemplate(binary: AssemblyReturn, inputPath: string,outputPath: string): string | undefined{
	const template = fs.readFileSync(inputPath).toString().split("<P>");
	for(let i = 1;i<template.length;i+=2){
		const [ label,index ] = template[ i ].split("."); 
		const paramValue = binary.params.get(label);
		if(!paramValue){
			return `Parameter not found: '${label}'`;
		}
		if(index){
			if(!/^[0-9]+$/.test(index)){
				return `Invalid index: '${index}'`;
			}
			const indexAsInt = Number.parseInt(index,10);
			if(indexAsInt >= template.length){
				return `Index: '${index}' should be less than ${template.length}`;
			}
			template[ i ] = paramValue[ indexAsInt ].toString(10);
		}else{
			template[ i ] = `[${paramValue.map(x => x.toString(10)).join(",")}]`;
		}
	}
	fs.writeFileSync(outputPath,template.join("").replace("<BINARYCODE>",binary.binaryCode));

}