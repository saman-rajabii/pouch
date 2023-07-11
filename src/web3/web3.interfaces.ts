import * as _Web3Utils from "web3-utils";

import _Web3 from "web3";

export type IWeb3Utils = typeof _Web3Utils;

export type IWeb3 = _Web3;

export declare type Wallet = {
  privateKey: string;
  address: string;
};

export declare type SignedTransaction = {
  messageHash?: string;
  r: string;
  s: string;
  v: string;
  rawTransaction?: string;
  transactionHash?: string;
};

export interface Networks {
  ethereum?: string;
  polygon?: string;
}
