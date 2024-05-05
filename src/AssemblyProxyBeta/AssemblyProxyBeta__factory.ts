/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  AssemblyProxyBeta,
  AssemblyProxyBetaInterface,
} from "./AssemblyProxyBeta";
import { EthereumException } from '../Exception/EthereumException';

const _abi = [
  {
    inputs: [
      {
        internalType: "enum AssemblyProxyBetaDummy.AdminFuctionGetType",
        name: "func",
        type: "uint8",
      },
    ],
    name: "adminFunctionsGet",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum AssemblyProxyBetaDummy.AdminFuctionPutType",
        name: "func",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "parameter",
        type: "address",
      },
    ],
    name: "adminFunctionsPut",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
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
];

const _bytecode =
  "0x7F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD557F00000000000000000000000000000000000000000000000000000000000000007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE5561024860008160918239F336604a575B36600080376000600036817FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE545AF46040573D6000803E3D6000FD5B3D6000803E3D6000F35B60003560E01C8063b0ee3ae71461014a5763c488fe3b036004577FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD543303600457346101b25760043560f557602435803B6100ab5760526000816101f68239FD5B807FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE557Fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b600080A2005B60243580602052336000527FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD557F7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f60406000A1005B7FFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFD543303600457346101b2576004356101a8577FFFFFFFFFFFFFFFFFFFFFFFFFFFFFDCFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE5460005260206000F35B3360005260206000F35B603D6000816101be8239FD08c379a00000000000000000000000000000000000000000000000000000000000000001134e4f54205041594d454e5420414c4c4f57454408c379a000000000000000000000000000000000000000000000000000000000000000012D455243313936373a206e657720696d706c656d656e746174696f6e206973206e6f74206120636f6e7472616374"

export class AssemblyProxyBeta__factory extends ContractFactory {
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
  ): Promise<AssemblyProxyBeta> {
    return super.deploy(overrides || {}) as Promise<AssemblyProxyBeta>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): AssemblyProxyBeta {
    return super.attach(address) as AssemblyProxyBeta;
  }
  connect(signer: Signer): AssemblyProxyBeta__factory {
    return super.connect(signer) as AssemblyProxyBeta__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AssemblyProxyBetaInterface {
    return new utils.Interface(_abi) as AssemblyProxyBetaInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AssemblyProxyBeta {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as AssemblyProxyBeta;
  }
}
