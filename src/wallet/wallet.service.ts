import { Injectable } from "@nestjs/common";
import { Web3Service } from "../web3/web3.service";
import { BIP32Factory } from "bip32";
import * as bip39 from "bip39";
import * as ecc from "tiny-secp256k1";
import { PouchConfigOptions } from "./wallet.interfaces";
import { IWeb3 } from "../web3/web3.interfaces";
import { startCase } from "lodash";

@Injectable()
export class WalletService {
  constructor(private web3Service: Web3Service, options: PouchConfigOptions) {
    Object.keys(options.networks).forEach((key) => {
      const startCaseKey = startCase(key);
      console.log("key: ", startCaseKey);

      this.web3Service[`web3Instance${startCaseKey}`] =
        web3Service.createWeb3Instance(options.networks[key]);

      console.log(this.web3Service.web3InstancePolygon);
    });

    console.log("options: ", options);
    console.log("web3InstancePolygon: ", this.web3Service.web3InstancePolygon);
  }
  async create(network: string, index?: number) {
    const startCaseNetwork = startCase(network);
    console.log("startCaseNetwork: ", startCaseNetwork);

    const mnemonics = bip39.generateMnemonic();
    console.log("mnemonics: ", mnemonics);

    const seed = await bip39.mnemonicToSeed(mnemonics);
    console.log("seed: ", seed);

    const node = BIP32Factory(ecc).fromSeed(seed);

    const child = node.derivePath(`m/44'/800'/0'/0/0`);

    const privateKey = child.privateKey;

    // const publicKey = child.publicKey.toString("hex");

    const web3Instance = this.web3Service[
      `web3Instance${startCaseNetwork}`
    ] as IWeb3;

    const address = web3Instance.utils.toChecksumAddress(
      web3Instance.eth.accounts.privateKeyToAccount(privateKey.toString("hex"))
        .address
    );

    if (!(mnemonics && address && privateKey)) {
      throw new Error(`${mnemonics}, ${address} ,${privateKey}`);
    }

    return {
      mnemonics,
      address,
      privateKey: privateKey.toString("hex"),
    };
  }

  async login(email: string, password: string) {
    const user: any = {}; // try to find user pass in database

    if (!user) {
      // trow error
    }

    const mnemonics = user.mnemonics;
    const seed = await bip39.mnemonicToSeed(mnemonics);
    const node = BIP32Factory(ecc).fromSeed(seed);
    const child = node.derivePath(`m/44'/60'/${user.index}'/0/0`);

    // const privateKey = child.privateKey.toString('hex');
    const address = `0x${child.publicKey.toString("hex")}`;

    return address;
  }

  async getBalanceOfToken(
    walletAddress: string,
    tokenAddresses: string[],
    network: string
  ) {
    // Define your custom ABI that includes the balanceOf function for each token contract
    const balancePartABI: any[] = [
      {
        constant: true,
        inputs: [
          {
            name: "_owner",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            name: "balance",
            type: "uint256",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];

    // Create a new instance of the ERC20 token contract
    const startCaseNetwork = startCase(network);

    const web3Instance = this.web3Service.getWeb3Instance(startCaseNetwork);

    const result = [];
    // Loop through the token contract addresses and call the balanceOf function for each one
    for (const tokenContractAddress of tokenAddresses) {
      const tokenContract = new web3Instance.eth.Contract(
        balancePartABI,
        tokenContractAddress
      );

      const balance = await tokenContract.methods
        .balanceOf(walletAddress)
        .call();

      result.push({
        tokenContractAddress,
        balance: this.web3Service.fromWei(String(balance)),
      });
    }
    return result;
  }

  async transferToken(
    walletAddress: string,
    privateKey: string,
    tokenAddress: string,
    toAddress: string,
    amount: string,
    network: string
  ) {
    const transferPartAbi: any = [
      {
        constant: false,
        inputs: [
          {
            name: "_to",
            type: "address",
          },
          {
            name: "_value",
            type: "uint256",
          },
        ],
        name: "transfer",
        outputs: [
          {
            name: "",
            type: "bool",
          },
        ],
        type: "function",
      },
    ];

    // Create a new instance of the ERC20 token contract
    const startCaseNetwork = startCase(network);

    const web3Instance = this.web3Service.getWeb3Instance(startCaseNetwork);

    const tokenContract = new web3Instance.eth.Contract(
      transferPartAbi,
      tokenAddress,
      {
        from: walletAddress,
      }
    );

    amount = this.web3Service.toWei(amount);
    // Estimate the gas required to execute the transfer
    const gas = await tokenContract.methods
      .transfer(toAddress, amount)
      .estimateGas();

    // Get the current gas price
    const gasPrice = await web3Instance.eth.getGasPrice();

    // Calculate the total cost of the transaction
    // const totalCost = gas * Number(gasPrice);

    // Create a new transaction object with the transfer details
    const tx = {
      from: walletAddress,
      to: tokenAddress,
      gas: gas,
      gasPrice: gasPrice,
      value: 0,
      data: tokenContract.methods.transfer(toAddress, amount).encodeABI(),
    };

    // Sign and send the transaction to transfer the tokens
    const signedTx = await web3Instance.eth.accounts.signTransaction(
      tx,
      privateKey
    );
    const txReceipt = await web3Instance.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    return txReceipt;
  }
  async estimateTransferGasFee(
    walletAddress: string,
    tokenAddress: string,
    toAddress: string,
    amount: number,
    network: string
  ) {
    const transferPartAbi: any = [
      {
        constant: false,
        inputs: [
          {
            name: "_to",
            type: "address",
          },
          {
            name: "_value",
            type: "uint256",
          },
        ],
        name: "transfer",
        outputs: [
          {
            name: "",
            type: "bool",
          },
        ],
        type: "function",
      },
    ];

    // Create a new instance of the ERC20 token contract
    const tokenContract = new this.web3Service[
      `web3Instance${network}`
    ].eth.Contract(transferPartAbi, tokenAddress);

    // Estimate the gas required to execute the transfer
    const gas = await tokenContract.methods
      .transfer(toAddress, amount)
      .estimateGas({ from: walletAddress });

    // Get the current gas price
    const gasPrice = await this.web3Service[
      `web3Instance${network}`
    ].eth.getGasPrice();

    // Calculate the total cost of the transaction
    const totalCost = gas * +gasPrice;

    return totalCost;
  }
  // getTokens() {
  //   // get list from database and get their balances from web3
  // }
}
