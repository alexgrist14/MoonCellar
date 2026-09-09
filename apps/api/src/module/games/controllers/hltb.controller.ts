import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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

@ApiTags("HLTB")
@Controller("hltb")
export class HltbController {
  constructor(private readonly hltb: HltbService) {}

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
  @ApiOperation({ summary: "Backfill HLTB completion times for games" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "delayMs", required: false })
  @ApiQuery({
    name: "onlyMissing",
    required: false,
    default: false,
    type: Boolean,
  })
  @ApiQuery({ name: "staleDays", required: false })
  async backfillHltb(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("onlyMissing") onlyMissingQuery?: string,
    @Query("staleDays") staleDaysQuery?: string
  ) {
    this.hltb.syncAllGames({
      limit: parsePositiveInt(limitQuery),
      delayMs: parsePositiveInt(delayMsQuery),
      onlyMissing: onlyMissingQuery === "true",
      staleDays: parsePositiveInt(staleDaysQuery),
    });

    return { message: "HLTB backfill started" };
  }

  @Delete("/remove-all")
  @ApiOperation({ summary: "Remove stored HLTB times from all games" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @HttpCode(HttpStatus.OK)
  async clearHltb() {
    return this.hltb.clearAllHltb();
  }
}

const parsePositiveInt = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};
