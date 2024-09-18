/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../typechain/common";
import type {
  AssemblyProxyGamma,
  AssemblyProxyGammaInterface,
} from "./AssemblyProxyGamma";
import { EthereumException } from "../Exception/EthereumException";

const _abi = [
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
    inputs: [
      {
        internalType: "enum AssemblyProxyGamma.AdminFuctionGetType",
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
] as const;

const _bytecode =
  "<BINARYCODE>";

export class AssemblyProxyGamma__factory extends ContractFactory {
  constructor(admin: string, implementation: string, adminStorage: string, signer?: Signer) {
    let cAdmin = admin.startsWith("0x") ? admin.substring(2) : admin;
    let cImplementation = implementation.startsWith("0x") ? implementation.substring(2) : implementation;
    let cAdminStorage = adminStorage.startsWith("0x") ? adminStorage.substring(2) : adminStorage;

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

    if(!/^[0-9a-fA-F]+$/.test(cAdminStorage)){
      throw new EthereumException("ADMIN STORAGE ADDRESS IS NOT A VALID HEX NUMBER");
    }

    if(cAdminStorage.length > 64){
      throw new EthereumException("ADMIN STORAGE ADDRESS HAS WRONG LENGTH SHOULD BE 64 (32 BYTES) FOUND: " + cImplementation.length);
    }

    if(cAdmin.length !==64){
      cAdmin = '0'.repeat(64-cAdmin.length) + cAdmin;
    }

    if(cImplementation.length !==64){
      cImplementation = '0'.repeat(64-cImplementation.length) + cImplementation;
    }

    if(cAdminStorage.length !==64){
      cAdminStorage = '0'.repeat(64-cAdminStorage.length) + cAdminStorage;
    }

    const buffCode = Buffer.from(_bytecode);
    const adminCode = Buffer.from(cAdmin);
    const implementationCode = Buffer.from(cImplementation);
    const adminStorageCode = Buffer.from(cAdminStorage);
    adminCode.copy(buffCode,(<P>ADMIN<P>)[0]*2);
    implementationCode.copy(buffCode,(<P>IMPL<P>)[0]*2);
    (<P>ADMIN_STORAGE_ADDRESS<P>).map(x => adminStorageCode.copy(buffCode,x*2));
    super(_abi, buffCode.toString(), signer);
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      AssemblyProxyGamma & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): AssemblyProxyGamma__factory {
    return super.connect(runner) as AssemblyProxyGamma__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AssemblyProxyGammaInterface {
    return new Interface(_abi) as AssemblyProxyGammaInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): AssemblyProxyGamma {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as AssemblyProxyGamma;
  }
}
