import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { findGame } from "../../games/games";
import {
  GameBoardParamsDto,
  GameEntryParamsDto,
  GameLeaderboardDto,
  GameLeaderboardQueryDto,
  GameReplayDto,
  GameSubmitResultDto,
  GameSubmitScoreDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { LeaderboardsService } from "./leaderboards.service";

@ApiTags("Leaderboards")
@Controller("games/:game/leaderboards")
export class LeaderboardsController {
  constructor(private readonly leaderboards: LeaderboardsService) {}

  @Get("entries/:entryId/replay")
  @ApiOperation({ summary: "The replay recorded with a leaderboard entry" })
  @ApiOkResponse({ type: GameReplayDto })
  getReplay(@Param() params: GameEntryParamsDto) {
    return this.leaderboards.getReplay(findGame(params.game), params.entryId);
  }

  @Get(":board")
  @ApiOperation({ summary: "A leaderboard, best score first" })
  @ApiOkResponse({ type: GameLeaderboardDto })
  getLeaderboard(
    @Param() params: GameBoardParamsDto,
    @Query() query: GameLeaderboardQueryDto
  ) {
    return this.leaderboards.getLeaderboard(
      findGame(params.game, params.board),
      params.board,
      query.limit,
      query.offset
    );
  }

  @Put(":board")
  @ApiOperation({
    summary:
      "Submit a score with its replay; it replaces the player's entry only if better",
  })
  @ApiOkResponse({ type: GameSubmitResultDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  @HttpCode(HttpStatus.OK)
  submit(
    @Param() params: GameBoardParamsDto,
    @Body() dto: GameSubmitScoreDto,
    @Req() request: IGameRequest
  ) {
    return this.leaderboards.submit(
      findGame(params.game, params.board),
      params.board,
      request.account,
      dto.score,
      dto.replay
    );
  }
}
