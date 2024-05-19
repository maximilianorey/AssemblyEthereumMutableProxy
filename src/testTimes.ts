import dotenv from "dotenv";
import { Provider, JsonRpcProvider, Wallet, HDNodeWallet } from "ethers";
import fs from "fs";

import { AssemblyProxy__factory } from "./AssemblyProxy/AssemblyProxy__factory";
import { BasicProxy__factory } from "./typechain/factories/contracts/BasicProxy__factory";
import { BasicUpgradeable__factory } from "./typechain/factories/contracts/BasicUpgradeable__factory";
import { ERC20Imp__factory } from "./typechain/factories/contracts/ERC20Imp__factory";
import { BasicUpgradeable, ERC20Imp } from "./typechain";
import { AssemblyProxyBeta__factory } from "./AssemblyProxyBeta/AssemblyProxyBeta__factory";

dotenv.config({ path: "./.env" });

const directions = JSON.parse(fs.readFileSync("./contractsDirections.json").toString());

async function runOne(webName: string, provider: Provider, forcedDeploy: boolean) {
  let res = "";
  try{
    const wallet0 = Wallet.fromPhrase(process.env.mnemonic!).connect(provider);
    const wallet1 = HDNodeWallet.fromPhrase(process.env.mnemonic!,"m/44'/60'/0'/1").connect(provider);

    let zeppelingUpgradeable: BasicUpgradeable;
    let erc20: ERC20Imp;
    let basicProxy: ERC20Imp;
    let myProxyAlpha: ERC20Imp;
    let myProxyBeta: ERC20Imp;

    if(webName!=='local' && !forcedDeploy && !directions[webName]){
      console.log(`DIRECTION ON WEB ${webName} NOT FOUND. DEPLOYING.`)
    }
    
    const deploy = webName==='local' || forcedDeploy || !directions[webName];

    if(deploy){
      const zeppelingUpgradeableFactory = new BasicUpgradeable__factory(wallet0);
      res += "\nDEPLOYING UPGRADEABLE"
      zeppelingUpgradeable = await zeppelingUpgradeableFactory.deploy();
      await zeppelingUpgradeable.waitForDeployment();
      res += "\nINIT UPGRADEABLE"

      await (await zeppelingUpgradeable.init()).wait();

      const erc20Factory = new ERC20Imp__factory(wallet0);
      res += "\nDEPLOYING ERC20"
      erc20 = await erc20Factory.deploy();
      await erc20.waitForDeployment();
      const erc20Addr = await erc20.getAddress();
      res += "\nDEPLOYING BASIC PROXY"

      const basicProxyFactory = new BasicProxy__factory(wallet0);
      const basic = await basicProxyFactory.deploy(
        wallet1.address,
        erc20Addr
      );
      await basic.waitForDeployment();
      const basicProxyAddr = await (
        basic
      ).getAddress();
      res += "\nDEPLOYING PROXY ALPHA"

      const proxyRootAlpha = await new AssemblyProxy__factory(wallet1.address, erc20Addr, wallet0).deploy();
      await proxyRootAlpha.waitForDeployment();
      res += "\nDEPLOYING PROXY BETA"
      const proxyRootBeta = await new AssemblyProxyBeta__factory(wallet1.address, erc20Addr, wallet0).deploy();
      await proxyRootBeta.waitForDeployment();
      const proxyRootAlphaAddr = await proxyRootAlpha.getAddress();
      const proxyRootBetaAddr = await proxyRootBeta.getAddress();

      basicProxy = ERC20Imp__factory.connect(basicProxyAddr, wallet0);
      myProxyAlpha = ERC20Imp__factory.connect(proxyRootAlphaAddr, wallet0);
      myProxyBeta = ERC20Imp__factory.connect(proxyRootBetaAddr, wallet0);

      directions[webName] = {
        //zeppelingUpgradeable: await zeppelingUpgradeable.getAddress(),
        erc20: erc20Addr,
        basicProxy: basicProxyAddr,
        myProxyAlpha: await myProxyAlpha.getAddress(),
        myProxyBeta: await myProxyBeta.getAddress()
      };
    }else{
      const {
        zeppelingUpgradeable: zeppelingUpgradeableAddress,
        erc20: erc20Address,
        basicProxy: basicProxyAddress,
        myProxyAlpha: myProxyAlphaAddress,
        myProxyBeta: myProxyBetaAddress
      } = directions[webName];
      zeppelingUpgradeable = BasicUpgradeable__factory.connect(zeppelingUpgradeableAddress,wallet0);
      erc20 = ERC20Imp__factory.connect(erc20Address,wallet0);
      basicProxy = ERC20Imp__factory.connect(basicProxyAddress,wallet0);
      myProxyAlpha = ERC20Imp__factory.connect(myProxyAlphaAddress,wallet0);
      myProxyBeta = ERC20Imp__factory.connect(myProxyBetaAddress,wallet0);
    }

    res = `RESULTS FOR ${webName}:`
    res += ("\nMINT 20");
    res += ("\n\tWITHOUT PROXY");
    res += (
      `\t\t\t${(await erc20.mint.estimateGas(wallet0.address, "20")).toString()}`
    );
    res += ("\n\tZEPPELING UPGRADEABLE");
    res += (
      `\t\t\t${(
        await zeppelingUpgradeable.mint.estimateGas(wallet0.address, "20")
      ).toString()}`
    ); 
    res += ("\n\tOPEN ZEPELLING PROXY");
    res += (
      `\t\t\t${(
        await basicProxy.mint.estimateGas(wallet0.address, "20")
      ).toString()}`
    );
    res += ("\n\tMY PROXY ALPHA");
    res += (
      `\t\t\t${(await myProxyAlpha.mint.estimateGas(wallet0.address, "20")).toString()}`
    );
    res += ("\n\tMY PROXY BETA");
    res += (
      `\t\t\t${(await myProxyBeta.mint.estimateGas(wallet0.address, "20")).toString()}`
    );

    await (await erc20.mint(wallet0.address, "20")).wait();
    await (await zeppelingUpgradeable.mint(wallet0.address, "20")).wait();
    await (await basicProxy.mint(wallet0.address, "20")).wait();
    await (await myProxyAlpha.mint(wallet0.address, "20")).wait();
    await (await myProxyBeta.mint(wallet0.address, "20")).wait();

    res += ("\nMINT 20");
    res += ("\n\tWITHOUT PROXY");
    res += (
      `\t\t\t${(await erc20.mint.estimateGas(wallet0.address, "20")).toString()}`
    );
    res += ("\n\tZEPPELING UPGRADEABLE");
    res += (
      `\t\t\t${(
        await zeppelingUpgradeable.mint.estimateGas(wallet0.address, "20")
      ).toString()}`
    );
    res += ("\n\tOPEN ZEPELLING PROXY");
    res += (
      `\t\t\t${(
        await basicProxy.mint.estimateGas(wallet0.address, "20")
      ).toString()}`
    );
    res += ("\n\tMY PROXY ALPHA");
    res += (
      `\t\t\t${(await myProxyAlpha.mint.estimateGas(wallet0.address, "20")).toString()}`
    );
    res += ("\n\tMY PROXY BETA");
    res += (
      `\t\t\t${(await myProxyBeta.mint.estimateGas(wallet0.address, "20")).toString()}`
    );

    await (await erc20.mint(wallet0.address, "20")).wait();
    await (await zeppelingUpgradeable.mint(wallet0.address, "20")).wait();
    await (await basicProxy.mint(wallet0.address, "20")).wait();
    await (await myProxyAlpha.mint(wallet0.address, "20")).wait();
    await (await myProxyBeta.mint(wallet0.address, "20")).wait();

    res += ("\nTRANSFER PART:");
    res += ("\n\tWITHOUT PROXY");
    res += (
      `\t\t\t${(
        await erc20.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15"
        )
      ).toString()}`
    );
    res += ("\n\tZEPPELING UPGRADEABLE");
    res += (
      `\t\t\t${(
        await zeppelingUpgradeable.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15"
        )
      ).toString()}`
    ); 
    res += ("\n\tOPEN ZEPELLING PROXY");
    res += (
      `\t\t\t${(
        await basicProxy.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15"
        )
      ).toString()}`
    );
    res += ("\n\tMY PROXY ALPHA");
    res += (
      `\t\t\t${(
        await myProxyAlpha.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "15"
        )
      ).toString()}`
    );
    res += ("\n\tMY PROXY BETA");
    res += (
      `\t\t\t${(
        await myProxyBeta.transfer.estimateGas(
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

    res += ("\nTRANSFER TOTAL");
    res += ("\n\tWITHOUT PROXY");
    res += (
      `\t\t\t${(
        await erc20.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "25"
        )
      ).toString()}`
    );
     res += ("\n\tZEPPELING UPGRADEABLE");
    res += (
      `\t\t\t${(
        await zeppelingUpgradeable.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "25"
        )
      ).toString()}`
    ); 
    res += ("\n\tOPEN ZEPELLING PROXY");
    res += (
      `\t\t\t${(
        await basicProxy.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "25"
        )
      ).toString()}`
    );
    res += ("\n\tMY PROXY ALPHA");
    res += (
      `\t\t\t${(
        await myProxyAlpha.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "25"
        )
      ).toString()}`
    );
    res += ("\n\tMY PROXY BETA");
    res += (
      `\t\t\t${(
        await myProxyBeta.transfer.estimateGas(
          "0x0000000000000000000000000000000000000001",
          "25"
        )
      ).toString()}`
    );

    await (
      await erc20.transfer("0x0000000000000000000000000000000000000001", "25")
    ).wait();
     await (
      await zeppelingUpgradeable.transfer(
        "0x0000000000000000000000000000000000000001",
        "25"
      )
    ).wait(); 
    await (
      await basicProxy.transfer(
        "0x0000000000000000000000000000000000000001",
        "25"
      )
    ).wait();
    await (
      await myProxyAlpha.transfer("0x0000000000000000000000000000000000000001", "25")
    ).wait();
    await (
      await myProxyBeta.transfer("0x0000000000000000000000000000000000000001", "25")
    ).wait();

    console.log(res);
  }catch(err){
      if(err instanceof Error){
        err.message = `ERROR FOR ${webName}:\n compute until:\n${res}\nError:\n${err.message}`;
      }
      if(err instanceof String){
        err = `ERROR FOR ${webName}:\n` + err;
      }
      throw err;
  }

}

async function run() {
  if (!process.env.amoy_api_key) {
    console.error("AMOY API KEY NOT CONFIGURED");
    process.exit(1);
  }

  if (!process.env.sepolia_api_key) {
    console.error("SEPOLIA API KEY NOT CONFIGURED");
    process.exit(1);
  }

  const forcedDeploy = process.argv.includes("--forced-deploy");

  await Promise.all([
      runOne(
        'binance',
          new JsonRpcProvider(
            "https://data-seed-prebsc-2-s3.binance.org:8545/",
          ),
          forcedDeploy
      ).catch(console.error),
      runOne(
        'sepolia',
        new JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${process.env.sepolia_api_key}`
        ),
        forcedDeploy
      ).catch(console.error),
      runOne(
        'Amoy',
        new JsonRpcProvider(`https://polygon-amoy.g.alchemy.com/v2/${process.env.amoy_api_key}`),
        forcedDeploy
        ).catch(console.error),
      runOne(
        'rsk',
        new JsonRpcProvider(
          "https://public-node.testnet.rsk.co",
        ),
        forcedDeploy
    ).catch(console.error),
      runOne(
        'fantom',
        new JsonRpcProvider(
          "https://rpc.testnet.fantom.network/",
        ),
        forcedDeploy
      ).catch(console.error),
      runOne(
        'avax',
        new JsonRpcProvider(
          "https://api.avax-test.network/ext/bc/C/rpc",
        ),
        forcedDeploy
      ).catch(console.error)
  ])

  fs.writeFileSync("./contractsDirections.json",JSON.stringify(directions,undefined,2));
}

run().catch(console.error);
