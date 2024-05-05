import dotenv from "dotenv";
import { providers, Wallet } from "ethers";

import { BasicProxy__factory } from "./typechain/factories/BasicProxy__factory";
import { BasicUpgradeable__factory } from "./typechain/factories/BasicUpgradeable__factory";
import { ERC20Imp__factory } from "./typechain/factories/ERC20Imp__factory";
import { AssemblyProxyBeta__factory } from "./AssemblyProxyBeta/AssemblyProxyBeta__factory";
import { AssemblyProxy__factory } from "./AssemblyProxy/AssemblyProxy__factory";

dotenv.config({ path: "./.env" });


async function runOne(provider: providers.Provider) {
  if(!process.env.mnemonic){
    throw new Error("MNEMONIC NOT CONFIGURED");
  }
  const wallet0 = Wallet.fromMnemonic(process.env.mnemonic).connect(provider);
  const wallet1 = Wallet.fromMnemonic(process.env.mnemonic,"m/44'/60'/0'/1").connect(provider);

    const zeppelingUpgradeableFactory = new BasicUpgradeable__factory(wallet0);

    const zeppelingUpgradeable = await zeppelingUpgradeableFactory.deploy();

    await (await zeppelingUpgradeable.init()).wait();

    const erc20Factory = new ERC20Imp__factory(wallet0);
    const erc20 = await erc20Factory.deploy();

    const basicProxyFactory = new BasicProxy__factory(wallet0);
    const basicProxyAddr = (
      await basicProxyFactory.deploy(
        wallet1.address,
        erc20.address
      )
    ).address;

    const proxyRootAlpha = await new AssemblyProxy__factory(wallet1.address, erc20.address, wallet0).deploy();
    const proxyRootBeta = await new AssemblyProxyBeta__factory(wallet1.address, erc20.address, wallet0).deploy();


    const basicProxy = ERC20Imp__factory.connect(basicProxyAddr, wallet0);
    const myProxyAlpha = ERC20Imp__factory.connect(proxyRootAlpha.address, wallet0);
    const myProxyBeta = ERC20Imp__factory.connect(proxyRootBeta.address, wallet0);
  

  console.log("\nMINT 20");
  console.log("\n\tWITHOUT PROXY");
  console.log(
    `\t\t${(await erc20.estimateGas.mint(wallet0.address, "20")).toString()}`
  );
  console.log("\n\tZEPPELING UPGRADEABLE");
  console.log(
    `\t\t${(
      await zeppelingUpgradeable.estimateGas.mint(wallet0.address, "20")
    ).toString()}`
  );
  console.log("\n\tOPEN ZEPELLING PROXY");
  console.log(
    `\t\t${(
      await basicProxy.estimateGas.mint(wallet0.address, "20")
    ).toString()}`
  );
  console.log("\n\tMY PROXY ALPHA");
  console.log(
    `\t\t${(await myProxyAlpha.estimateGas.mint(wallet0.address, "20")).toString()}`
  );
  console.log("\n\tMY PROXY BETA");
  console.log(
    `\t\t${(await myProxyBeta.estimateGas.mint(wallet0.address, "20")).toString()}`
  );

  await (await erc20.mint(wallet0.address, "20")).wait();
  await (await zeppelingUpgradeable.mint(wallet0.address, "20")).wait();
  await (await basicProxy.mint(wallet0.address, "20")).wait();
  await (await myProxyAlpha.mint(wallet0.address, "20")).wait();
  await (await myProxyBeta.mint(wallet0.address, "20")).wait();

  console.log("\nMINT 20");
  console.log("\n\tWITHOUT PROXY");
  console.log(
    `\t\t${(await erc20.estimateGas.mint(wallet0.address, "20")).toString()}`
  );
  console.log("\n\tZEPPELING UPGRADEABLE");
  console.log(
    `\t\t${(
      await zeppelingUpgradeable.estimateGas.mint(wallet0.address, "20")
    ).toString()}`
  );
  console.log("\n\tOPEN ZEPELLING PROXY");
  console.log(
    `\t\t${(
      await basicProxy.estimateGas.mint(wallet0.address, "20")
    ).toString()}`
  );
  console.log("\n\tMY PROXY ALPHA");
  console.log(
    `\t\t${(await myProxyAlpha.estimateGas.mint(wallet0.address, "20")).toString()}`
  );
  console.log("\n\tMY PROXY BETA");
  console.log(
    `\t\t${(await myProxyBeta.estimateGas.mint(wallet0.address, "20")).toString()}`
  );

  await (await erc20.mint(wallet0.address, "20")).wait();
  await (await zeppelingUpgradeable.mint(wallet0.address, "20")).wait();
  await (await basicProxy.mint(wallet0.address, "20")).wait();
  await (await myProxyAlpha.mint(wallet0.address, "20")).wait();
  await (await myProxyBeta.mint(wallet0.address, "20")).wait();

  console.log("\nTRANSFER PART:");
  console.log("\n\tWITHOUT PROXY");
  console.log(
    `\t\t${(
      await erc20.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "15"
      )
    ).toString()}`
  );
  console.log("\n\tZEPPELING UPGRADEABLE");
  console.log(
    `\t\t${(
      await zeppelingUpgradeable.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "15"
      )
    ).toString()}`
  );
  console.log("\n\tOPEN ZEPELLING PROXY");
  console.log(
    `\t\t${(
      await basicProxy.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "15"
      )
    ).toString()}`
  );
  console.log("\n\tMY PROXY ALPHA");
  console.log(
    `\t\t${(
      await myProxyAlpha.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "15"
      )
    ).toString()}`
  );
  console.log("\n\tMY PROXY BETA");
  console.log(
    `\t\t${(
      await myProxyBeta.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "15"
      )
    ).toString()}`
  );

  await (
    await erc20.transfer("0x0000000000000000000000000000000000000001", "15")
  ).wait();
  await (
    await zeppelingUpgradeable.transfer(
      "0x0000000000000000000000000000000000000001",
      "15"
    )
  ).wait();
  await (
    await basicProxy.transfer(
      "0x0000000000000000000000000000000000000001",
      "15"
    )
  ).wait();
  await (
    await myProxyAlpha.transfer("0x0000000000000000000000000000000000000001", "15")
  ).wait();
  await (
    await myProxyBeta.transfer("0x0000000000000000000000000000000000000001", "15")
  ).wait();

  console.log("\nTRANSFER TOTAL");
  console.log("\n\tWITHOUT PROXY");
  console.log(
    `\t\t${(
      await erc20.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "5"
      )
    ).toString()}`
  );
  console.log("\n\tZEPPELING UPGRADEABLE");
  console.log(
    `\t\t${(
      await zeppelingUpgradeable.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "5"
      )
    ).toString()}`
  );
  console.log("\n\tOPEN ZEPELLING PROXY");
  console.log(
    `\t\t${(
      await basicProxy.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "5"
      )
    ).toString()}`
  );
  console.log("\n\tMY PROXY ALPHA");
  console.log(
    `\t\t${(
      await myProxyAlpha.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "5"
      )
    ).toString()}`
  );
  console.log("\n\tMY PROXY BETA");
  console.log(
    `\t\t${(
      await myProxyBeta.estimateGas.transfer(
        "0x0000000000000000000000000000000000000001",
        "5"
      )
    ).toString()}`
  );

  await (
    await erc20.transfer("0x0000000000000000000000000000000000000001", "5")
  ).wait();
  await (
    await zeppelingUpgradeable.transfer(
      "0x0000000000000000000000000000000000000001",
      "5"
    )
  ).wait();
  await (
    await basicProxy.transfer(
      "0x0000000000000000000000000000000000000001",
      "5"
    )
  ).wait();
  await (
    await myProxyAlpha.transfer("0x0000000000000000000000000000000000000001", "5")
  ).wait();
  await (
    await myProxyBeta.transfer("0x0000000000000000000000000000000000000001", "5")
  ).wait();
}

runOne(
    new providers.JsonRpcProvider(
      "http://localhost:8545",
    )
  ).catch(console.error)
