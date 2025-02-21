import { HDNodeWallet, LangEn } from "ethers";

export function derivateWallet(mnemonic: string, n: number){
	return HDNodeWallet.fromPhrase(mnemonic,"",`m/44'/60'/0'/0/${n}`, LangEn.wordlist());
}