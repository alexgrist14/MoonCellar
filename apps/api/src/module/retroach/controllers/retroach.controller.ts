import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { RetroachievementsService } from "../services/retroach.service";

@ApiTags("RetroAchievements")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
@Controller("/ra")
export class RetroachievementsController {
  constructor(
    private readonly retroachievementsService: RetroachievementsService
  ) {}

  @Post("/sync")
  @ApiOperation({
    summary: "Match RA consoles to platforms and RA games to games",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  sync() {
    return this.retroachievementsService.sync();
  }

  @Post("/games/parse")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Link a game to a RetroAchievements set by id, or refresh the sets it already has",
  })
  @ApiQuery({ name: "gameId", required: true })
  @ApiQuery({
    name: "raId",
    required: false,
    description:
      "RetroAchievements game id to link; without it the linked sets are refreshed",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  parseGame(@Query("gameId") gameId: string, @Query("raId") raId?: string) {
    return this.retroachievementsService.parseGame(gameId, raId);
  }

  @Post("/awards/parse")
  @ApiOperation({ summary: "Parse RA awards for all linked users" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  parseUsersAwards() {
    return this.retroachievementsService.parseUsersAwards();
  }
}
