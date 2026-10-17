import { Module } from "@nestjs/common";
import { AccountModule } from "../account/account.module";
import { SignalGateway } from "./signal.gateway";
import { SignalService } from "./signal.service";

@Module({
  imports: [AccountModule],
  providers: [SignalService, SignalGateway],
})
export class SignalModule {}
