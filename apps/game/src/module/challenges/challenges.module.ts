import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import { LeaderboardsModule } from "../leaderboards/leaderboards.module";
import { ChallengesController } from "./challenges.controller";
import { ChallengesService } from "./challenges.service";
import { Challenge, ChallengeSchema } from "./schemas/challenge.schema";

@Module({
  imports: [
    AccountModule,
    LeaderboardsModule,
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
