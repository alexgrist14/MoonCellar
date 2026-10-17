import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import { LevelsController } from "./levels.controller";
import { LevelsService } from "./levels.service";
import { Level, LevelSchema } from "./schemas/level.schema";

@Module({
  imports: [
    AccountModule,
    MongooseModule.forFeature([{ name: Level.name, schema: LevelSchema }]),
  ],
  controllers: [LevelsController],
  providers: [LevelsService],
})
export class LevelsModule {}
