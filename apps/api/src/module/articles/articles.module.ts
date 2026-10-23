import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { ArticlesController } from "./controllers/articles.controller";
import { Article, ArticleDatabaseSchema } from "./schemas/article.schema";
import { ArticlesService } from "./services/articles.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleDatabaseSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
