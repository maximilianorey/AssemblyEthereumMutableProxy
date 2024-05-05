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

const _bytecode =
  "0x7F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD557F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE556102c760008160918239F37FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD5480331460c7575B36600080377FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE54600060003681845AF46065573D6000803E3D6000FD5B7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE540360bb577FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD540360bb573D6000803E3D6000F35B603D6000816102008239FD5B60003560E01C80635C60DA1B146101065780633659CFE6146101365780638F2839701461019a5763F851A44003602857346101f4573360005260206000F35B346101f4577FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE5460005260206000F35B346101f457600435803B6101505760526000816102758239FD5B807FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE557Fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b600080A2005B346101f45760043580602052336000527FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD557F7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f60406000A1005B603D60008161023d8239FD08c379a000000000000000000000000000000000000000000000000000000000000000011850524f585920524547495354455220434f5252555054454408c379a00000000000000000000000000000000000000000000000000000000000000001134e4f54205041594d454e5420414c4c4f57454408c379a000000000000000000000000000000000000000000000000000000000000000012D455243313936373a206e657720696d706c656d656e746174696f6e206973206e6f74206120636f6e7472616374"

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
    adminCode.copy(buffCode,1*2+2);
    implementationCode.copy(buffCode,68*2+2);
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
