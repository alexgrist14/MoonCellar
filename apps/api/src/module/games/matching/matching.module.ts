import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../schemas/game.schema";
import { Platform, PlatformDatabaseSchema } from "../schemas/platform.schema";
import { GameMatcherService } from "./game-matcher.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
    ]),
  ],
  providers: [GameMatcherService],
  exports: [GameMatcherService],
})
export class MatchingModule {}
