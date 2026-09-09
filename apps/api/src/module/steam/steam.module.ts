import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SteamService } from "./services/steam.service";
import { SteamController } from "./controllers/steam.controller";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  controllers: [SteamController],
  providers: [SteamService],
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
    ]),
    MetricsModule,
  ],
})
export class SteamModule {}
