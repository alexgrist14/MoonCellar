import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "../games/schemas/playthroughs.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import {
  Rating,
  UserRatingsDatabaseSchema,
} from "../user/schemas/user-ratings.schema";
import { CommentsController } from "./controllers/comments.controller";
import { ReviewsController } from "./controllers/reviews.controller";
import {
  CommentReport,
  CommentReportDatabaseSchema,
} from "./schemas/comment-report.schema";
import {
  CommentVote,
  CommentVoteDatabaseSchema,
} from "./schemas/comment-vote.schema";
import {
  GameComment,
  GameCommentDatabaseSchema,
} from "./schemas/game-comment.schema";
import { CommentsGateway } from "./gateways/comments.gateway";
import { CommentsService } from "./services/comments.service";
import { CommunityLookupService } from "./services/community-lookup.service";
import { ReviewsService } from "./services/reviews.service";
import { VotesService } from "./services/votes.service";

@Module({
  controllers: [CommentsController, ReviewsController],
  providers: [
    CommentsGateway,
    CommentsService,
    ReviewsService,
    VotesService,
    CommunityLookupService,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: GameComment.name, schema: GameCommentDatabaseSchema },
      { name: CommentVote.name, schema: CommentVoteDatabaseSchema },
      { name: CommentReport.name, schema: CommentReportDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
    ]),
  ],
})
export class CommentsModule {}
