import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../user/schemas/user.schema";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import {
  Rating,
  UserRatingsDatabaseSchema,
} from "../user/schemas/user-ratings.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "../games/schemas/playthroughs.schema";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
