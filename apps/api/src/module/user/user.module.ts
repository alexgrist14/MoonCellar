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
import { FileOrphansService } from "./services/file-orphans.service";
import { FilesController } from "./controllers/files.controller";
import {
  Rating,
  UserRatingsDatabaseSchema,
} from "./schemas/user-ratings.schema";
import { UserRatingsController } from "./controllers/user-ratings.controller";
import { UserRatingsService } from "./services/user-ratings.service";
import { MetricsModule } from "../metrics/metrics.module";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { JwtModule } from "@nestjs/jwt";
import { UserRoyalGamesService } from "./services/user-royal-games.service";
import { RoyalGamesGateway } from "./gateways/royal-games.gateway";
import { NotificationsModule } from "../notifications/notifications.module";
import { AccountDeletionService } from "./services/account-deletion.service";
import { UserAccountController } from "./controllers/user-account.controller";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "../games/schemas/playthroughs.schema";
import {
  GameComment,
  GameCommentDatabaseSchema,
} from "../comments/schemas/game-comment.schema";
import {
  CommentVote,
  CommentVoteDatabaseSchema,
} from "../comments/schemas/comment-vote.schema";
import {
  CommentReport,
  CommentReportDatabaseSchema,
} from "../comments/schemas/comment-report.schema";
import {
  CustomList,
  CustomListDatabaseSchema,
} from "../collections/schemas/custom-list.schema";
import {
  CustomListLike,
  CustomListLikeDatabaseSchema,
} from "../collections/schemas/custom-list-like.schema";
import {
  Notification,
  NotificationDatabaseSchema,
} from "../notifications/schemas/notification.schema";
import {
  PushSubscription,
  PushSubscriptionDatabaseSchema,
} from "../notifications/schemas/push-subscription.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "User", schema: UserSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: GameComment.name, schema: GameCommentDatabaseSchema },
      { name: CommentVote.name, schema: CommentVoteDatabaseSchema },
      { name: CommentReport.name, schema: CommentReportDatabaseSchema },
      { name: CustomList.name, schema: CustomListDatabaseSchema },
      { name: CustomListLike.name, schema: CustomListLikeDatabaseSchema },
      { name: Notification.name, schema: NotificationDatabaseSchema },
      { name: PushSubscription.name, schema: PushSubscriptionDatabaseSchema },
    ]),
    MetricsModule,
    NotificationsModule,
    JwtModule.register({}),
  ],

  controllers: [
    UserProfileController,
    UserAccountController,
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
    FileOrphansService,
    UserFollowingsService,
    UserLogsService,
    UserRatingsService,
    UserRAService,
    UserRoyalGamesService,
    RoyalGamesGateway,
    AccountDeletionService,
  ],
  exports: [AccountDeletionService],
})
export class UserModule {}
