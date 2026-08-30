function calculateSize(index:number){
	return Math.ceil(Math.log(index)/Math.log(2)/8);
}

function numberToHexString(index: number, size?: number){
	if(size){
		const indexStr = index.toString(16);
		if(indexStr.length==size*2){
			return indexStr;
		}
		if(indexStr.length<size*2){
			return indexStr.padStart(size*2,"0");
		}
		throw new Error(`Number '${index}' too long for size ${size}`);
	}
	const res = index.toString(16);
	if(res.length % 2 == 0){
		return res;
	}
	return "0" + res;
    
}


/*
            0x60 - 0x7F (PUSH)
            0x-- // ERROR LENGTH
            ...
            0x--
            0x60 // PUSH1
            0x00 // 0
            0x81 // DUP2(ERROR LENGTH)
            0x60 - 0x7F (PUSH)
            0x-- // ERROR INDEX
            ...
            0x--
            0x82 // DUP3 (0)
            0x39 // CODECOPY
            0xFD // REVERT
			<ERROR_CODE_ON_HEXA>
*/

export function generateError(errorText: string,index:number,hardhat2Compatibility:boolean){
	const errorHex = Buffer.from(errorText).toString("hex");
	const errorBuff: Array<string> = [];
	if(hardhat2Compatibility){
		errorBuff.push("08c379a00000000000000000000000000000000000000000000000000000000000000020");
		errorBuff.push(numberToHexString(errorHex.length/2,32));
		errorBuff.push(errorHex);
		const noAlignedSize = 36 + 32 + errorHex.length/2;
		if((noAlignedSize - 4) % 32 != 0){
			errorBuff.push("".padStart((32 - ((noAlignedSize - 4) % 32))*2,"0"));
		}
	}else{
		errorBuff.push("08c379a0");
		const errorLength = numberToHexString(errorHex.length/2);
		errorBuff.push(numberToHexString(errorLength.length/2,32));
		errorBuff.push(errorLength);
		errorBuff.push(errorHex);
	}

	const m1 = errorBuff.join("");

	const errorLength = errorHex.length/2;
	const messageLength = m1.length/2;
	const newIndexLength = calculateSize(index + 8 + calculateSize(errorLength) + 32 + messageLength);

	const newIndex = index + 8 + calculateSize(errorLength) + newIndexLength;

	const res: Array<string> = [];
	res.push(numberToHexString(0x60 + calculateSize(messageLength) - 1));
	res.push(numberToHexString(messageLength));
	res.push("600081");

	res.push(numberToHexString(0x60 + newIndexLength - 1));
	res.push(numberToHexString(newIndex,newIndexLength));
	res.push("8239FD");
	res.push(m1);

	return res.join("");
}

        