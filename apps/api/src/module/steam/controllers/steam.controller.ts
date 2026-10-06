import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
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
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { SteamService } from "../services/steam.service";
import { SteamAchievementsService } from "../services/steam-achievements.service";
import { SteamGamesService } from "../services/steam-games.service";

@ApiTags("Steam")
@Controller("steam")
export class SteamController {
  constructor(
    private readonly service: SteamService,
    private readonly achievements: SteamAchievementsService,
    private readonly steamGames: SteamGamesService
  ) {}

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/sync")
  @ApiOperation({
    summary:
      "Link Steam games to catalogue games: Steam ids already on games, unambiguous names, conflicts for the rest",
  })
  syncSteamGames() {
    void this.steamGames.sync().catch(() => undefined);

    return { message: "Steam games sync started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/achievements/sync")
  @ApiOperation({
    summary:
      "Read the achievement count of every game with a Steam app id, missing ones first",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  syncAchievements(@Query("limit") limitQuery?: string) {
    const limit = limitQuery ? Number(limitQuery) : undefined;

    if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
      throw new BadRequestException("limit must be a positive integer");
    }

    void this.achievements.sync({ limit }).catch(() => undefined);

    return { message: "Steam achievements sync started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/achievements/games/:gameId")
  @ApiOperation({ summary: "Read the Steam achievement count of one game" })
  async syncGameAchievements(@Param("gameId") gameId: string) {
    const result = await this.achievements.syncGame(gameId);

    if (!result) {
      throw new NotFoundException("The game has no Steam app id");
    }

    return result;
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse-links")
  @ApiOperation({
    summary:
      "Parse Steam store links from games' websites and store them as a Steam entry in externalPages",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "Also re-parse games that already have a Steam entry in externalPages (by default only games missing it are parsed)",
  })
  parseSteamLinks(@Query("forceParse") forceParseQuery?: string) {
    void this.service
      .parseSteamLinksForGames({
        forceParse: forceParseQuery === "true",
      })
      .catch(() => undefined);

    return { message: "Parsing started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse")
  @ApiOperation({
    summary:
      "Parse the Steam store link for a single game by id or slug and store it as a Steam entry in externalPages",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({
    name: "id",
    required: false,
    description: "Id of the game to parse",
  })
  @ApiQuery({
    name: "slug",
    required: false,
    description: "Slug of the game to parse",
  })
  async parseSteamLink(@Query("id") id?: string, @Query("slug") slug?: string) {
    if (!id && !slug) {
      throw new BadRequestException("Either id or slug must be provided");
    }

    return this.service.parseSteamLinkForGame({ id, slug });
  }
}
