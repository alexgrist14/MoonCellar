import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserLogsService } from "../user/services/user-logs.service";
import { UserLogs, UserLogsSchema } from "../user/schemas/user-logs.schema";
import { PlaythroughsService } from "./services/playthroughs.service";
import { GamesController } from "./controllers/games.controller";
import { PlaythroughsController } from "./controllers/playthorughs.controller";
import { Platform, PlatformDatabaseSchema } from "./schemas/platform.schema";
import { Game, GameDatabaseSchema } from "./schemas/game.schema";
import { Character, CharacterDatabaseSchema } from "./schemas/character.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "./schemas/playthroughs.schema";
import { FileService } from "../user/services/file-upload.service";
import { PlatformsController } from "./controllers/platforms.controller";
import { PlatformsService } from "./services/platforms.service";
import { CharactersController } from "./controllers/characters.controller";
import { CharactersService } from "./services/characters.service";
import { GamesService } from "./services/games.service";
import { GameAiDraftService } from "./services/game-ai-draft.service";
import {
  GameAiDraft,
  GameAiDraftDatabaseSchema,
} from "./schemas/game-ai-draft.schema";
import { HltbService } from "./services/hltb.service";
import { HltbController } from "./controllers/hltb.controller";
import { MetricsModule } from "../metrics/metrics.module";
import { User, UserSchema } from "../user/schemas/user.schema";
import {
  Rating,
  UserRatingsDatabaseSchema,
} from "../user/schemas/user-ratings.schema";
import { IndexNowModule } from "../indexnow/indexnow.module";
import { VndbService } from "./services/vndb.service";
import { VndbController } from "./controllers/vndb.controller";
import { ImageDedupeController } from "./controllers/image-dedupe.controller";
import { ImageDedupeService } from "./services/image-dedupe.service";
import { ContentRequestsController } from "./controllers/content-requests.controller";
import { ContentRequestsService } from "./services/content-requests.service";
import {
  ContentRequest,
  ContentRequestDatabaseSchema,
} from "./schemas/content-request.schema";
import { HttpModule } from "@nestjs/axios";
import { IgdbModule } from "../igdb/igdb.module";
import { IgdbOrphansController } from "../igdb/controllers/igdb-orphans.controller";
import { IgdbOrphansService } from "../igdb/igdb-orphans.service";
import { JwtModule } from "@nestjs/jwt";
import { MatchingModule } from "./matching/matching.module";
import { ConflictsModule } from "../conflicts/conflicts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  controllers: [
    GamesController,
    PlaythroughsController,
    PlatformsController,
    HltbController,
    CharactersController,
    VndbController,
    ImageDedupeController,
    ContentRequestsController,
    IgdbOrphansController,
  ],
  providers: [
    GamesService,
    GameAiDraftService,
    HltbService,
    PlaythroughsService,
    UserLogsService,
    FileService,
    PlatformsService,
    CharactersService,
    VndbService,
    ImageDedupeService,
    ContentRequestsService,
    IgdbOrphansService,
  ],
  imports: [
    IgdbModule,
    MatchingModule,
    ConflictsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Character.name, schema: CharacterDatabaseSchema },
      { name: ContentRequest.name, schema: ContentRequestDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: User.name, schema: UserSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
      { name: GameAiDraft.name, schema: GameAiDraftDatabaseSchema },
    ]),
    MetricsModule,
    IndexNowModule,
    HttpModule,
    JwtModule.register({}),
  ],
})
export class GamesModule {}
