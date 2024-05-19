import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, HDNodeWallet } from "ethers";

import { AssemblyProxy__factory } from "./AssemblyProxy/AssemblyProxy__factory";
import { BasicProxy__factory } from "./typechain/factories/contracts/BasicProxy__factory";
import { BasicUpgradeable__factory } from "./typechain/factories/contracts/BasicUpgradeable__factory";
import { ERC20Imp__factory } from "./typechain/factories/contracts/ERC20Imp__factory";
import { AssemblyProxyBeta__factory } from "./AssemblyProxyBeta/AssemblyProxyBeta__factory";

dotenv.config({ path: "./.env" });


async function run() {
  const provider = new JsonRpcProvider("http://localhost:8545");

  const wallet0 = Wallet.fromPhrase(process.env.mnemonic!).connect(provider);
  const wallet1 = HDNodeWallet.fromPhrase(process.env.mnemonic!,"m/44'/60'/0'/1").connect(provider);


  const zeppelingUpgradeableFactory = new BasicUpgradeable__factory(wallet0);
  console.log("\nDEPLOYING UPGRADEABLE");
  const zeppelingUpgradeable = await zeppelingUpgradeableFactory.deploy();
  await zeppelingUpgradeable.waitForDeployment();
  console.log("\nINIT UPGRADEABLE")

  await (await zeppelingUpgradeable.init()).wait();

  const erc20Factory = new ERC20Imp__factory(wallet0);
  console.log("\nDEPLOYING ERC20")
  const erc20 = await erc20Factory.deploy();
  await erc20.waitForDeployment();
  const erc20Addr = await erc20.getAddress();
  console.log("\nDEPLOYING BASIC PROXY")

  const basicProxyFactory = new BasicProxy__factory(wallet0);
  const basic = await basicProxyFactory.deploy(
    wallet1.address,
    erc20Addr
  );
  await basic.waitForDeployment();
  const basicProxyAddr = await (
    basic
  ).getAddress();
  console.log("\nDEPLOYING PROXY ALPHA")

  const proxyRootAlpha = await new AssemblyProxy__factory(wallet1.address, erc20Addr, wallet0).deploy();
  await proxyRootAlpha.waitForDeployment();
  console.log("\nDEPLOYING PROXY BETA")
  const proxyRootBeta = await new AssemblyProxyBeta__factory(wallet1.address, erc20Addr, wallet0).deploy();
  await proxyRootBeta.waitForDeployment();
  const proxyRootAlphaAddr = await proxyRootAlpha.getAddress();
  const proxyRootBetaAddr = await proxyRootBeta.getAddress();

  const basicProxy = ERC20Imp__factory.connect(basicProxyAddr, wallet0);
  const myProxyAlpha = ERC20Imp__factory.connect(proxyRootAlphaAddr, wallet0);
  const myProxyBeta = ERC20Imp__factory.connect(proxyRootBetaAddr, wallet0);
    

  console.log("\nMINT 20");
  console.log("\n\tWITHOUT PROXY");
  console.log(
    `\t\t\t${(await erc20.mint.estimateGas(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).toString()}`
  );
  console.log("\n\tZEPPELING UPGRADEABLE");
  console.log(
    `\t\t\t${(
      await zeppelingUpgradeable.mint.estimateGas(wallet0.address, "20",{ nonce: await wallet0.getNonce() })
    ).toString()}`
  ); 
  console.log("\n\tOPEN ZEPELLING PROXY");
  console.log(
    `\t\t\t${(
      await basicProxy.mint.estimateGas(wallet0.address, "20",{ nonce: await wallet0.getNonce() })
    ).toString()}`
  );
  console.log("\n\tMY PROXY ALPHA");
  console.log(
    `\t\t\t${(await myProxyAlpha.mint.estimateGas(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).toString()}`
  );
  console.log("\n\tMY PROXY BETA");
  console.log(
    `\t\t\t${(await myProxyBeta.mint.estimateGas(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).toString()}`
  );

    await (await erc20.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();
    await (await zeppelingUpgradeable.mint(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).wait();
    await (await basicProxy.mint(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).wait();
    await (await myProxyAlpha.mint(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).wait();
    await (await myProxyBeta.mint(wallet0.address, "20",{ nonce: await wallet0.getNonce() })).wait();
    
    console.log("\nMINT 20");
    console.log("\n\tWITHOUT PROXY");
    console.log(
      `\t\t\t${(await erc20.mint.estimateGas(wallet0.address, "20")).toString()}`
    );
    console.log("\n\tZEPPELING UPGRADEABLE");
    console.log(
      `\t\t\t${(
        await zeppelingUpgradeable.mint.estimateGas(wallet0.address, "20", { nonce: await wallet0.getNonce() })
      ).toString()}`
    );
    console.log("\n\tOPEN ZEPELLING PROXY");
    console.log(
      `\t\t\t${(
        await basicProxy.mint.estimateGas(wallet0.address, "20", { nonce: await wallet0.getNonce() })
      ).toString()}`
    );
    console.log("\n\tMY PROXY ALPHA");
    console.log(
      `\t\t\t${(await myProxyAlpha.mint.estimateGas(wallet0.address, "20", { nonce: await wallet0.getNonce() })).toString()}`
    );
    console.log("\n\tMY PROXY BETA");
    console.log(
      `\t\t\t${(await myProxyBeta.mint.estimateGas(wallet0.address, "20", { nonce: await wallet0.getNonce() })).toString()}`
    );


    await (await erc20.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();
    await (await zeppelingUpgradeable.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();
    await (await basicProxy.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();
    await (await myProxyAlpha.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();
    await (await myProxyBeta.mint(wallet0.address, "20", { nonce: await wallet0.getNonce() })).wait();

    console.log("\nTRANSFER PART:");
    console.log("\n\tWITHOUT PROXY");
    console.log(
      `\t\t\t${(
        await erc20.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
    console.log("\n\tZEPPELING UPGRADEABLE");
    console.log(
      `\t\t\t${(
        await zeppelingUpgradeable.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    ); 
    console.log("\n\tOPEN ZEPELLING PROXY");
    console.log(
      `\t\t\t${(
        await basicProxy.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
    console.log("\n\tMY PROXY ALPHA");
    console.log(
      `\t\t\t${(
        await myProxyAlpha.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
    console.log("\n\tMY PROXY BETA");
    console.log(
      `\t\t\t${(
        await myProxyBeta.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );

    await (
      await erc20.transfer("0x0000000000000000000000000000000000000001", "15", { nonce: await wallet0.getNonce() })
    ).wait();
     await (
      await zeppelingUpgradeable.transfer(
        "0x0000000000000000000000000000000000000001",
        "15",
        { nonce: await wallet0.getNonce() }
      )
    ).wait(); 
    await (
      await basicProxy.transfer(
        "0x0000000000000000000000000000000000000001",
        "15",
        { nonce: await wallet0.getNonce() }
      )
    ).wait();
    await (
      await myProxyAlpha.transfer("0x0000000000000000000000000000000000000001", "15", { nonce: await wallet0.getNonce() })
    ).wait();
    await (
      await myProxyBeta.transfer("0x0000000000000000000000000000000000000001", "15", { nonce: await wallet0.getNonce() })
    ).wait();

    console.log("\nTRANSFER TOTAL");
    console.log("\n\tWITHOUT PROXY");
    console.log(
      `\t\t\t${(
        await erc20.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "5",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
     console.log("\n\tZEPPELING UPGRADEABLE");
    console.log(
      `\t\t\t${(
        await zeppelingUpgradeable.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "5",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    ); 
    console.log("\n\tOPEN ZEPELLING PROXY");
    console.log(
      `\t\t\t${(
        await basicProxy.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "5",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
    console.log("\n\tMY PROXY ALPHA");
    console.log(
      `\t\t\t${(
        await myProxyAlpha.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "5",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
    console.log("\n\tMY PROXY BETA");
    console.log(
      `\t\t\t${(
        await myProxyBeta.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "5",
          { nonce: await wallet0.getNonce() }
        )
      ).toString()}`
    );
}

run().catch(console.error)
