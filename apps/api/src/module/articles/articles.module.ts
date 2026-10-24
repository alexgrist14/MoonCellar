import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CommentReport,
  CommentReportDatabaseSchema,
} from "../comments/schemas/comment-report.schema";
import {
  CommentVote,
  CommentVoteDatabaseSchema,
} from "../comments/schemas/comment-vote.schema";
import {
  GameComment,
  GameCommentDatabaseSchema,
} from "../comments/schemas/game-comment.schema";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { NotificationsModule } from "../notifications/notifications.module";
import { User, UserSchema } from "../user/schemas/user.schema";
import { ArticlesController } from "./controllers/articles.controller";
import { Article, ArticleDatabaseSchema } from "./schemas/article.schema";
import {
  ArticleView,
  ArticleViewDatabaseSchema,
} from "./schemas/article-view.schema";
import { ArticlesService } from "./services/articles.service";

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleDatabaseSchema },
      { name: ArticleView.name, schema: ArticleViewDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: GameComment.name, schema: GameCommentDatabaseSchema },
      { name: CommentVote.name, schema: CommentVoteDatabaseSchema },
      { name: CommentReport.name, schema: CommentReportDatabaseSchema },
    ]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
