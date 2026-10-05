import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SteamService } from "./services/steam.service";
import { SteamAccountService } from "./services/steam-account.service";
import { SteamController } from "./controllers/steam.controller";
import { SteamAccountController } from "./controllers/steam-account.controller";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { MetricsModule } from "../metrics/metrics.module";
import { CollectionsModule } from "../collections/collections.module";

@Module({
  controllers: [SteamController, SteamAccountController],
  providers: [SteamService, SteamAccountService],
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MetricsModule,
    CollectionsModule,
  ],
})
export class SteamModule {}
