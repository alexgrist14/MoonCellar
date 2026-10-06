import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SteamService } from "./services/steam.service";
import { SteamAchievementsService } from "./services/steam-achievements.service";
import { SteamProgressService } from "./services/steam-progress.service";
import { SteamPlaythroughsService } from "./services/steam-playthroughs.service";
import { SteamGamesService } from "./services/steam-games.service";
import { SteamLibraryService } from "./services/steam-library.service";
import { ConflictsModule } from "../conflicts/conflicts.module";
import { GamesModule } from "../games/games.module";
import { MatchingModule } from "../games/matching/matching.module";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "../games/schemas/playthroughs.schema";
import { SteamAccountService } from "./services/steam-account.service";
import { SteamController } from "./controllers/steam.controller";
import { SteamAccountController } from "./controllers/steam-account.controller";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import {
  SteamLibrary,
  SteamLibrarySchema,
} from "./schemas/steam-library.schema";
import { MetricsModule } from "../metrics/metrics.module";
import { CollectionsModule } from "../collections/collections.module";

@Module({
  controllers: [SteamController, SteamAccountController],
  providers: [
    SteamService,
    SteamAccountService,
    SteamAchievementsService,
    SteamProgressService,
    SteamPlaythroughsService,
    SteamGamesService,
    SteamLibraryService,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
      { name: SteamLibrary.name, schema: SteamLibrarySchema },
    ]),
    MetricsModule,
    CollectionsModule,
    ConflictsModule,
    GamesModule,
    MatchingModule,
  ],
})
export class SteamModule {}
