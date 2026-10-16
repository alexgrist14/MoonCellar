import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LeaderboardsController } from "./leaderboards.controller";
import { LeaderboardsService } from "./leaderboards.service";
import {
  LeaderboardEntry,
  LeaderboardEntrySchema,
} from "./schemas/leaderboard-entry.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaderboardEntry.name, schema: LeaderboardEntrySchema },
    ]),
  ],
  controllers: [LeaderboardsController],
  providers: [LeaderboardsService],
})
export class LeaderboardsModule {}
