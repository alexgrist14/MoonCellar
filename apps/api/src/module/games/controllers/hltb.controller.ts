import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { RolesEnum } from "@mooncellar/schemas";
import { HltbService } from "../services/hltb.service";
import { HltbAiService } from "../services/hltb-ai.service";
import type { IAuthorizedRequest } from "../../comments/types/community.type";

@ApiTags("HLTB")
@Controller("hltb")
export class HltbController {
  constructor(
    private readonly hltb: HltbService,
    private readonly hltbAi: HltbAiService
  ) {}

  @Post("/games/parse")
  @ApiOperation({
    summary: "Parse HLTB times for a single game by MoonCellar id or slug",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: "gameId",
    required: false,
    description: "MoonCellar id of the game to parse",
  })
  @ApiQuery({
    name: "slug",
    required: false,
    description: "MoonCellar slug of the game to parse",
  })
  @ApiQuery({
    name: "hltbId",
    required: false,
    description:
      "Link the game to this exact HLTB entry instead of searching for a match",
  })
  async parseGame(
    @Query("gameId") gameId?: string,
    @Query("slug") slug?: string,
    @Query("hltbId") hltbId?: string
  ) {
    if (!gameId && !slug) {
      throw new BadRequestException("Either gameId or slug must be provided");
    }

    return this.hltb.syncGame({ gameId, slug, hltbId });
  }

  @Post("/backfill")
  @ApiOperation({
    summary:
      "Download the HLTB catalogue and match every game against it in the background",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async backfillHltb() {
    this.hltb.syncAllGames().catch(() => undefined);

    return { message: "HLTB backfill started" };
  }

  @Post("/conflicts/ai")
  @ApiOperation({
    summary:
      "Ask OpenAI to judge undecided HLTB conflicts in the background; with apply, confident matches are decided",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: "limit",
    required: false,
    description: "How many conflicts without a verdict to judge (default 200)",
  })
  @ApiQuery({
    name: "apply",
    required: false,
    description:
      "true decides every confident match, including verdicts stored by earlier runs",
  })
  reviewConflicts(
    @Req() request: IAuthorizedRequest,
    @Query("limit") limit?: string,
    @Query("apply") apply?: string
  ) {
    return this.hltbAi.start(
      { limit: Math.max(0, Number(limit) || 200), apply: apply === "true" },
      request.user
    );
  }

  @Post("/conflicts/ai/undo")
  @ApiOperation({
    summary:
      "Undo in the background every HLTB match the AI made and put those conflicts back in the queue",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  undoAiDecisions(@Req() request: IAuthorizedRequest) {
    return this.hltbAi.startUndo(request.user);
  }

  @Delete("/remove-all")
  @ApiOperation({ summary: "Remove stored HLTB times from all games" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async clearHltb() {
    return this.hltb.clearAllHltb();
  }
}
