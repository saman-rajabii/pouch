import { Module } from "@nestjs/common";
import { Web3Service } from "./web3.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  providers: [Web3Service, ConfigModule],
  exports: [Web3Service],
})
export class Web3Module {}
