import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";
import { GameTokenGuard } from "./game-token.guard";

@Module({
  imports: [ConfigModule],
  controllers: [AccountController],
  providers: [AccountService, GameTokenGuard],
  exports: [AccountService, GameTokenGuard],
})
export class AccountModule {}
