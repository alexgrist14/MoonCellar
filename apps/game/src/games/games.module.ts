import { Module } from "@nestjs/common";
import { GamesController } from "./games.controller";

@Module({ controllers: [GamesController] })
export class GamesModule {}
