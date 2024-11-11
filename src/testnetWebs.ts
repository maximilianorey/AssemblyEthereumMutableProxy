import { JsonRpcProvider } from "ethers";

const blockchains: {[key: string]: {name: string, url: string, alchemy_key?: string}} = {
	binance: { name: "binance", url: "https://data-seed-prebsc-2-s3.binance.org:8545" },
	sepolia: { name: "sepolia", url: "https://unichain-sepolia.g.alchemy.com/v2/", alchemy_key: "sepolia_api_key" },
	amoy: { name: "amoy (polygon)", url: "https://polygon-mainnet.g.alchemy.com/v2/", alchemy_key: "amoy_api_key" },
	rsk: { name: "rsk", url: "https://public-node.testnet.rsk.co" },
	fantom: { name: "fantom", url: "https://rpc.testnet.fantom.network" },
	avax: { name: "avax", url: "https://api.avax-test.network/ext/bc/C/rpc" },
	"cardona-zkevm": { name: "cardona-zkevm (polygon)", url: "https://polygonzkevm-mainnet.g.alchemy.com/v2/", alchemy_key: "polygon_zkevm" }
};

function generateProvider(blockchainData: {name: string, url: string, alchemy_key?: string}): {isError: false, name: string, provider: JsonRpcProvider } | {isError: true, error: string}{
	if(blockchainData.alchemy_key){
		if(!process.env[blockchainData.alchemy_key]){
			return { isError: true, error: "ALCHEMY KEY NOT SET" };
		}
		return { isError: false, name: blockchainData.name, provider: new JsonRpcProvider(blockchainData.url + process.env[blockchainData.alchemy_key]) };
	}
	return { isError: false, name: blockchainData.name, provider: new JsonRpcProvider(blockchainData.url) };
}

export function getProvider(blockchainName: string): { isError: false, name: string, provider: JsonRpcProvider } | {isError: true, error: string} {
	const blockchainData = blockchains[blockchainName];
	if(!blockchainData) return { isError: true, error: `UNKNOWN BLOCKCHAIN: '${blockchainName}'` };
	return generateProvider(blockchainData);
}

export function getAllProviders(): {res: Array<{name: string, provider: JsonRpcProvider}>, errors: Array<string> } {
	const errors: Array<string> = [];
	const res: Array<{name: string, provider: JsonRpcProvider}> = [];
	Object.values(blockchains).map(x => {
		const provider = generateProvider(x);
		if(provider.isError){
			errors.push(provider.error);
		}else{
			res.push(provider);
		}
	});
	return { res, errors };
}