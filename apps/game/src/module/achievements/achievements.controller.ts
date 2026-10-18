import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { findGame } from "../../games/games";
import {
  GameAchievementIconParamsDto,
  GameAchievementListDto,
  GameAchievementParamsDto,
  GameAchievementPlayerParamsDto,
  GameAchievementReportDto,
  GameParamsDto,
  GamePlayerAchievementDto,
  GamePlayerAchievementsDto,
  GamePlayerGameAchievementsDto,
  GamePlayerParamsDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { AchievementsService } from "./achievements.service";

@ApiTags("Achievements")
@Controller("games/:game/achievements")
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @ApiOperation({
    summary:
      "The game's achievements in its order; texts of hidden ones are null",
  })
  @ApiOkResponse({ type: GameAchievementListDto })
  catalog(@Param() params: GameParamsDto) {
    return this.achievements.catalog(findGame(params.game));
  }

  @Get("icons/:icon")
  @ApiOperation({
    summary:
      "An achievement icon: a 24×24 SVG outline in currentColor, coloured by the page",
  })
  @ApiProduces("image/svg+xml")
  icon(
    @Param() params: GameAchievementIconParamsDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const svg = this.achievements.icon(findGame(params.game), params.icon);
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=86400");
    response.setHeader("X-Content-Type-Options", "nosniff");
    return svg;
  }

  @Get("me")
  @UseGuards(GameTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The signed-in player's achievements of the game" })
  @ApiOkResponse({ type: GamePlayerAchievementsDto })
  mine(@Param() params: GameParamsDto, @Req() request: IGameRequest) {
    return this.achievements.player(findGame(params.game), request.account.id);
  }

  @Get("players/:userId")
  @ApiOperation({ summary: "A player's achievements of the game, for the profile" })
  @ApiOkResponse({ type: GamePlayerAchievementsDto })
  player(@Param() params: GameAchievementPlayerParamsDto) {
    return this.achievements.player(findGame(params.game), params.userId);
  }

  @Put(":key")
  @UseGuards(GameTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Report an unlock (kept once, with its first time) and/or how far the player is; repeating it is safe",
  })
  @ApiOkResponse({ type: GamePlayerAchievementDto })
  report(
    @Param() params: GameAchievementParamsDto,
    @Body() body: GameAchievementReportDto,
    @Req() request: IGameRequest
  ) {
    return this.achievements.report(
      findGame(params.game),
      request.account,
      params.key,
      body
    );
  }
}

@ApiTags("Achievements")
@Controller("achievements/players/:userId")
export class PlayerAchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @ApiOperation({
    summary:
      "The games with achievements a player has started, with unlocked counts, for the profile",
  })
  @ApiOkResponse({ type: [GamePlayerGameAchievementsDto] })
  summary(@Param() params: GamePlayerParamsDto) {
    return this.achievements.summary(params.userId);
  }
}
