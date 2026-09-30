import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { ConflictsController } from "./controllers/conflicts.controller";
import { ConflictsGateway } from "./gateways/conflicts.gateway";
import { Conflict, ConflictSchema } from "./schemas/conflict.schema";
import { ConflictsService } from "./services/conflicts.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conflict.name, schema: ConflictSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [ConflictsController],
  providers: [ConflictsService, ConflictsGateway],
  exports: [ConflictsService],
})
export class ConflictsModule {}
