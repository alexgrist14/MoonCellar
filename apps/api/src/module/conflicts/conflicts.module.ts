import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Platform,
  PlatformDatabaseSchema,
} from "../games/schemas/platform.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { ConflictsController } from "./controllers/conflicts.controller";
import { ConflictsGateway } from "./gateways/conflicts.gateway";
import { Conflict, ConflictSchema } from "./schemas/conflict.schema";
import { ConflictsAiService } from "./services/conflicts-ai.service";
import { ConflictsService } from "./services/conflicts.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conflict.name, schema: ConflictSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Platform.name, schema: PlatformDatabaseSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [ConflictsController],
  providers: [ConflictsService, ConflictsAiService, ConflictsGateway],
  exports: [ConflictsService, ConflictsAiService],
})
export class ConflictsModule {}
