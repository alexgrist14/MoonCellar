import { Module } from "@nestjs/common";
import { RetroachievementsService } from "./services/retroach.service";
import { RetroachievementsController } from "./controllers/retroach.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { RAGame, RASchema } from "./schemas/retroach.schema";
import { RAConsole, RAConsoleSchema } from "./schemas/console.schema";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RAGame.name, schema: RASchema }]),
    MongooseModule.forFeature([
      { name: RAConsole.name, schema: RAConsoleSchema },
    ]),
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
    ]),
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformDatabaseSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MetricsModule,
  ],

  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
