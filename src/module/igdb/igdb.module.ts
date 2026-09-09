import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IGDBService } from "./igdb.service";
import { IgdbParserController } from "./controllers/igdb-parser.controller";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import {
  Character,
  CharacterDatabaseSchema,
} from "../games/schemas/character.schema";
import { FileService } from "../user/services/file-upload.service";
import { HttpModule } from "@nestjs/axios";
import { SyncState, SyncStateSchema } from "../games/schemas/sync-state.schema";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  controllers: [IgdbParserController],
  providers: [IGDBService, FileService],
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: Character.name, schema: CharacterDatabaseSchema },
      { name: SyncState.name, schema: SyncStateSchema },
    ]),
    MetricsModule,
  ],
})
export class IgdbModule {}
