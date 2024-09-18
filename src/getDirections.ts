import dotenv from "dotenv";
import { HDNodeWallet, Wallet } from "ethers";

dotenv.config({ path: "./.env" });

const mnemonic = process.env.mnemonic;
if(!mnemonic){
	console.error("MNEMONIC NOT SET ON ENVIRONMENT (.env file)");
	process.exit(1);
}

const wallet0 = Wallet.fromPhrase(mnemonic);
const wallet1 = HDNodeWallet.fromPhrase(mnemonic,undefined,"m/44'/60'/0'/0/1");

async function run(){
	console.log(await wallet0.getAddress());
	console.log(await wallet1.getAddress());
}

run().catch(console.error);