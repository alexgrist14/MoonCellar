import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import {
  AchievementsController,
  PlayerAchievementsController,
} from "./achievements.controller";
import { AchievementsService } from "./achievements.service";
import {
  AchievementState,
  AchievementStateSchema,
} from "./schemas/achievement-state.schema";

@Module({
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: AchievementState.name, schema: AchievementStateSchema },
    ]),
  ],
  controllers: [AchievementsController, PlayerAchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
