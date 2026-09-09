import {
  BadRequestException,
  Controller,
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
import { RolesEnum } from "src/shared/zod/schemas/role.schema";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { SteamService } from "../services/steam.service";

@ApiTags("Steam")
@Controller("steam")
export class SteamController {
  constructor(private readonly service: SteamService) {}

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
