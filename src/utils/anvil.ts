import { spawn, ChildProcessWithoutNullStreams } from "child_process";

let anvilProcess: ChildProcessWithoutNullStreams | null = null;

export function startAnvil(mnemonic: string): Promise<void> {
	if(anvilProcess!==null){
		Promise.reject(new Error("Anvil already started."));
	}
	return new Promise((resolve,rejects) => {
		anvilProcess = spawn("anvil", [ "--mnemonic", mnemonic ], {
			stdio: "pipe",
		});
		anvilProcess.stdout.on("data", (data) => {
			if (data.toString().includes("Listening on")) {
				resolve();
			}
		});
		anvilProcess.on("error",(err) =>{
			console.error(`Anvil error: ${err}`);
			rejects(err);
		});
	});
}

export function stopAnvil(): void {
	if(anvilProcess===null){
		throw new Error("Anvil not started.");
	}
	anvilProcess.kill("SIGINT");
	anvilProcess = null;
}