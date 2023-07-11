import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Web3 from "web3";
import { SignedTransaction, Networks, IWeb3 } from "./web3.interfaces";

@Injectable()
export class Web3Service {
  web3InstanceEthereum: IWeb3;
  web3InstancePolygon: IWeb3;

  // constructor(
  //   private configService: ConfigService,
  //   // @Inject(REQUEST) private request: Request
  //   // networks: Networks
  // ) {
  //   Object.keys(networks).forEach((key) => {
  //     this[`web3Instance${key}`] = new Web3.providers.HttpProvider(
  //       this.configService.get<string>(`WEB3_RPC_ENDPOINT_${key}`)
  //     );
  //   });

  //   // this.web3InstanceEthe = new Web3(
  //   //   new Web3.providers.HttpProvider(
  //   //     this.configService.get<string>(
  //   //       `WEB3_RPC_ENDPOINT_${this.request["network"]}`
  //   //     )
  //   //   )
  //   // );
  // }

  createWeb3Instance(networkAddress: string): Web3 {
    return new (Web3 as any)(
      new (Web3 as any).providers.HttpProvider(networkAddress)
    );

    // let instance: IWeb3 = new Web3.providers.HttpProvider(networkAddress);
    // return instance;
  }

  toWei(amoun: string): string {
    return Web3.utils.toWei(amoun, "ether");
  }

  fromWei(amoun: string): string {
    return Web3.utils.fromWei(amoun, "ether");
  }

  getWeb3Instance(network: string): Web3 {
    return this[`web3Instance${network}`];
  }
  /**
   * Create Polygon Transaction
   * @param {string} addressTo
   * @param {string} resourceAddress
   * @param {string} amount
   * @param {string} privateKey
   * @param { number | string} gas
   * @returns {SignedTransaction} transaction object
   */
  private async createTransaction(
    network: string,
    transaction: any,
    addressTo: string,
    resourceAddress: string,
    resourcePrivateKey: string,
    amount: string | number,
    privateKey: string,
    gas: number | string = 21000
  ): Promise<SignedTransaction> {
    //wallet should be change every 3 transactions
    if (!this[`web3Instance${network}`])
      throw new Error(`web3Instance${network} is not defined`);
    const account =
      this[`web3Instance${network}`].eth.accounts.privateKeyToAccount(
        resourcePrivateKey
      ).address;

    // const nonce = await this.web3Instance.eth.getTransactionCount(
    //   resourceAddress,
    // );

    const estimatedGas = await transaction.estimateGas({
      from: resourceAddress,
    });
    console.log(estimatedGas);

    const createTransaction = await this[
      `web3Instance${network}`
    ].eth.accounts.signTransaction(
      {
        // chainId: await this.web3Instance.eth.getChainId(),
        // nonce,
        from: resourceAddress,
        to: addressTo,
        value: this[`web3Instance${network}`].utils.toWei(
          amount.toString(),
          "ether"
        ),
        gas: estimatedGas,
        data: transaction.encodeABI(),
      },
      privateKey
    );
    return createTransaction;
  }

  /**
   * Sign And Boardcast Ethereum Transaction
   * @param {SignedTransaction} transaction
   * @returns {string} transaction hash
   */
  private async SignAndBoardCastTransaction(
    network: string,
    transaction: SignedTransaction
  ): Promise<any> {
    if (!this[`web3Instance${network}`])
      throw new Error(`web3Instance${network} is not defined`);

    const createReceipt = await this[
      `web3Instance${network}`
    ].eth.sendSignedTransaction(transaction.rawTransaction);
    if (createReceipt.status) return createReceipt.transactionHash;
    return "";
  }

  // async isValidAddress(address: string): Promise<boolean> {
  //   return this.web3Instance.utils.isAddress(address);
  // }

  async getBalance(network: string, address: string): Promise<string> {
    if (!this[`web3Instance${network}`])
      throw new Error(`web3Instance${network} is not defined`);

    return this[`web3Instance${network}`].utils.fromWei(
      await this[`web3Instance${network}`].eth.getBalance(address),
      "ether"
    );
  }

  async getTransaction(network: string, txHash: string) {
    if (!this[`web3Instance${network}`])
      throw new Error(`web3Instance${network} is not defined`);

    return this[`web3Instance${network}`].eth.getTransaction(txHash);
  }

  // async getContractAbi(contactAddress: string) {
  //   return await fetch("ether scan url");
  // }

  // async estimateOffRampGasPrice(amount: number) {}
  // async estimateOnRampGasPrice(amount: number) {}
}
