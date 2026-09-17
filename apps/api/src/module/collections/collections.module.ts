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
import { MetricsModule } from "../metrics/metrics.module";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { UserLogsService } from "../user/services/user-logs.service";
import { CustomListsController } from "./controllers/custom-lists.controller";
import { FavoritesController } from "./controllers/favorites.controller";
import { UsersSearchController } from "./controllers/users-search.controller";
import {
  CustomList,
  CustomListDatabaseSchema,
} from "./schemas/custom-list.schema";
import {
  CustomListLike,
  CustomListLikeDatabaseSchema,
} from "./schemas/custom-list-like.schema";
import { CustomListsService } from "./services/custom-lists.service";
import { FavoritesService } from "./services/favorites.service";
import { GeneratedListsService } from "./services/generated-lists.service";
import { UsersSearchService } from "./services/users-search.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomList.name, schema: CustomListDatabaseSchema },
      { name: CustomListLike.name, schema: CustomListLikeDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
    ]),
    MetricsModule,
  ],
  controllers: [
    CustomListsController,
    FavoritesController,
    UsersSearchController,
  ],
  providers: [
    CustomListsService,
    FavoritesService,
    GeneratedListsService,
    UsersSearchService,
    UserLogsService,
  ],
})
export class CollectionsModule {}
