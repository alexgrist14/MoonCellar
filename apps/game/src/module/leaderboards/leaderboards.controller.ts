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
import {
  GameEntryParamsDto,
  GameGhostDto,
  GameLeaderboardDto,
  GameLeaderboardQueryDto,
  GameLevelParamsDto,
  GameSubmitResultDto,
  GameSubmitTimeDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { LeaderboardsService } from "./leaderboards.service";

@ApiTags("Leaderboards")
@Controller("leaderboards")
export class LeaderboardsController {
  constructor(private readonly leaderboards: LeaderboardsService) {}

  @Get("entries/:entryId/ghost")
  @ApiOperation({ summary: "The recorded run of a leaderboard entry" })
  @ApiOkResponse({ type: GameGhostDto })
  getGhost(@Param() params: GameEntryParamsDto) {
    return this.leaderboards.getGhost(params.entryId);
  }

  @Get(":level")
  @ApiOperation({ summary: "Best times of a level, fastest first" })
  @ApiOkResponse({ type: GameLeaderboardDto })
  getLeaderboard(
    @Param() params: GameLevelParamsDto,
    @Query() query: GameLeaderboardQueryDto
  ) {
    return this.leaderboards.getLeaderboard(
      params.level,
      query.limit,
      query.offset
    );
  }

  @Put(":level")
  @ApiOperation({
    summary: "Submit a time; it replaces the player's entry only if faster",
  })
  @ApiOkResponse({ type: GameSubmitResultDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  @HttpCode(HttpStatus.OK)
  submit(
    @Param() params: GameLevelParamsDto,
    @Body() dto: GameSubmitTimeDto,
    @Req() request: IGameRequest
  ) {
    return this.leaderboards.submit(
      params.level,
      request.account,
      dto.timeMs,
      dto.ghost
    );
  }
}
