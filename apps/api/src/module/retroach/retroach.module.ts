import { Module } from "@nestjs/common";
import { RetroachievementsService } from "./services/retroach.service";
import { RetroachievementsController } from "./controllers/retroach.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { MetricsModule } from "../metrics/metrics.module";
import { ConflictsModule } from "../conflicts/conflicts.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
    ]),
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformDatabaseSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MetricsModule,
    ConflictsModule,
  ],

  controllers: [RetroachievementsController],
  providers: [RetroachievementsService],
})
export class RetroachievementsModule {}
