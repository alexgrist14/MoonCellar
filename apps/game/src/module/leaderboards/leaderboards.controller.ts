import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  GameLeaderboardDto,
  GameLeaderboardQueryDto,
  GameLevelParamsDto,
} from "../../shared/zod/dto/game.dto";
import { LeaderboardsService } from "./leaderboards.service";

@ApiTags("Leaderboards")
@Controller("leaderboards")
export class LeaderboardsController {
  constructor(private readonly leaderboards: LeaderboardsService) {}

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
}
