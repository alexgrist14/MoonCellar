import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "./schemas/user.schema";
import { UserProfileController } from "./controllers/user-profile.controller";
import { UserProfileService } from "./services/user-profile.service";
import { UserFiltersService } from "./services/user-filters.service";
import { UserFollowingsService } from "./services/user-followings.service";
import { UserFiltersController } from "./controllers/user-filters.controller";
import { UserFollowingsController } from "./controllers/user-followings.controller";
import { UserRAService } from "./services/user-ra.service";
import { UserRAController } from "./controllers/user-ra.controller";
import { UserPresetsService } from "./services/user-presets.service";
import { UserPresetsController } from "./controllers/user-presets.controller";
import { UserLogs, UserLogsSchema } from "./schemas/user-logs.schema";
import { UserLogsService } from "./services/user-logs.service";
import { UserLogsController } from "./controllers/user-logs.controller";
import { FileService } from "./services/file-upload.service";
import { FilesController } from "./controllers/files.controller";
import {
  Rating,
  UserRatingsDatabaseSchema,
} from "./schemas/user-ratings.schema";
import { UserRatingsController } from "./controllers/user-ratings.controller";
import { UserRatingsService } from "./services/user-ratings.service";
import { MetricsModule } from "../metrics/metrics.module";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "User", schema: UserSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
    ]),
    MetricsModule,
  ],

  controllers: [
    UserProfileController,
    UserFiltersController,
    UserPresetsController,
    UserFollowingsController,
    UserRAController,
    UserLogsController,
    UserRatingsController,
    FilesController,
  ],
  providers: [
    UserProfileService,
    UserFiltersService,
    UserPresetsService,
    FileService,
    UserFollowingsService,
    UserLogsService,
    UserRatingsService,
    UserRAService,
  ],
})
export class UserModule {}
