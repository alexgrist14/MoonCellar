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
import { HttpModule } from "@nestjs/axios";
import {
  VndbCandidate,
  VndbCandidateSchema,
} from "./schemas/vndb-candidates.schema";

@Module({
  controllers: [
    GamesController,
    PlaythroughsController,
    PlatformsController,
    HltbController,
    CharactersController,
    VndbController,
  ],
  providers: [
    GamesService,
    HltbService,
    PlaythroughsService,
    UserLogsService,
    FileService,
    PlatformsService,
    CharactersService,
    VndbService,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Character.name, schema: CharacterDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: UserLogs.name, schema: UserLogsSchema },
      { name: User.name, schema: UserSchema },
      { name: Rating.name, schema: UserRatingsDatabaseSchema },
      { name: VndbCandidate.name, schema: VndbCandidateSchema },
    ]),
    MetricsModule,
    IndexNowModule,
    HttpModule,
  ],
})
export class GamesModule {}
