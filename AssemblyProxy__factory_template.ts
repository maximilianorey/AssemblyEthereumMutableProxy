import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AssemblyProxy, AssemblyProxyInterface } from "./AssemblyProxy";
import { EthereumException } from '../Exception/EthereumException';

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "admin_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "implementation",
    outputs: [
      {
        internalType: "address",
        name: "implementation_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

let _bytecode =
  "<$BYTECODE>"

export class AssemblyProxy__factory extends ContractFactory {
  constructor(admin: string, implementation: string, signer?: Signer) {
    let cAdmin = admin.startsWith("0x") ? admin.substring(2) : admin;
    let cImplementation = implementation.startsWith("0x") ? implementation.substring(2) : implementation;

    if(!/^[0-9a-fA-F]+$/.test(cAdmin)){
      throw new EthereumException("ADMIN IS NOT A VALID HEX NUMBER");
    }

    if(cAdmin.length > 64 ){
      throw new EthereumException("ADMIN HAS WRONG LENGTH SHOULD BE 64 (32 BYTES) FOUND: " + cAdmin.length);
    }

    if(!/^[0-9a-fA-F]+$/.test(cImplementation)){
      throw new EthereumException("IMPLEMENTATION IS NOT A VALID HEX NUMBER");
    }

    if(cImplementation.length > 64){
      throw new EthereumException("IMPLEMENTATION HAS WRONG LENGTH SHOULD BE 64 (32 BYTES) FOUND: " + cImplementation.length);
    }

    if(cAdmin.length !==64){
      cAdmin = '0'.repeat(64-cAdmin.length) + cAdmin;
    }

    if(cImplementation.length !==64){
      cImplementation = '0'.repeat(64-cImplementation.length) + cImplementation;
    }

    const buffCode = Buffer.from(_bytecode);
    const adminCode = Buffer.from(cAdmin);
    const implementationCode = Buffer.from(cImplementation);
    adminCode.copy(buffCode,"<$INITIAL_ADMIN_DIR>"*2+2);
    implementationCode.copy(buffCode,"<$INITIAL_IMPLEMENTATION_DIR>"*2+2);
    super(_abi, buffCode.toString(), signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<AssemblyProxy> {
    return super.deploy(
      overrides || {}
    ) as Promise<AssemblyProxy>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): AssemblyProxy {
    return super.attach(address) as AssemblyProxy;
  }
  connect(signer: Signer): AssemblyProxy__factory {
    return super.connect(signer) as AssemblyProxy__factory;
  }
  static readonly abi = _abi;
  static createInterface(): AssemblyProxyInterface {
    return new utils.Interface(_abi) as AssemblyProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AssemblyProxy {
    return new Contract(address, _abi, signerOrProvider) as AssemblyProxy;
  }
}
