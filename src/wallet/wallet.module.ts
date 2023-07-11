import { DynamicModule, Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { PouchConfigOptions } from "./wallet.interfaces";
import { Web3Service } from "../web3/web3.service";
import { Web3Module } from "../web3/web3.module";

const walletServiceFactory = (options: PouchConfigOptions) => {
  return {
    provide: WalletService,
    useFactory: (Web3Service: Web3Service) => {
      return new WalletService(Web3Service, options);
    },
    inject: [Web3Service],
  };
};
@Module({
  imports: [Web3Module],
  providers: [WalletService],
})
export class WalletModule {
  static forRoot(options: PouchConfigOptions): DynamicModule {
    const providers = [
      walletServiceFactory(options),
      // {
      //   provide: WalletService,
      //   useValue: new WalletService(options),
      // },
    ];

    return {
      providers: providers,
      exports: providers,
      module: WalletModule,
    };
  }
}
