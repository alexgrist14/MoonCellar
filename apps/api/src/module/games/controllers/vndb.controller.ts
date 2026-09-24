import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { VndbService } from "../services/vndb.service";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import type { IAuthorizedRequest } from "../../comments/types/community.type";
import {
  DecideVndbCandidateRequestDto,
  GetVndbCandidatesRequestDto,
  VndbCandidatesResponseDto,
  VndbReviewItemResponseDto,
  VndbCandidatesSummaryDto,
  VndbParseResponseDto,
} from "../../../shared/zod/dto/vndb-candidates.dto";

@ApiTags("VNDB")
@Controller("vndb")
export class VndbController {
  constructor(private readonly vndbService: VndbService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get VNDB stats" })
  @ApiCreatedResponse({ type: Number })
  async getStats() {
    return this.vndbService.getStats();
  }

  @Post("vn")
  @ApiOperation({ summary: "Search vn by title" })
  async searchVn(@Body() dto: { title: string }) {
    return this.vndbService.searchVn(dto.title);
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("backfill")
  @ApiOperation({ summary: "Backfill VNDB visual novels into games" })
  @ApiQuery({
    name: "fromVnId",
    required: false,
    description:
      "Override the resume point; by default the run continues after the last VN written to games or candidates",
  })
  @ApiQuery({
    name: "restart",
    required: false,
    type: Boolean,
    description: "Start from the first VN instead of resuming",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Stop after this many VNs, for test runs",
  })
  backFill(
    @Query("fromVnId") fromVnId?: string,
    @Query("limit") limit?: string,
    @Query("restart") restart?: string
  ) {
    if (this.vndbService.isSyncRunning) {
      return { message: "VNDB sync is already running" };
    }

    this.vndbService
      .backFill({
        fromVnId,
        limit: limit ? Number(limit) : undefined,
        restart: restart === "true",
      })
      .catch(() => undefined);

    return { message: "VNDB backfill started" };
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("sync")
  @ApiOperation({
    summary:
      "Run the daily VNDB sync now: new VNs after the last known id, then a refresh of the least recently synced games",
  })
  sync() {
    if (this.vndbService.isSyncRunning) {
      return { message: "VNDB sync is already running" };
    }

    this.vndbService.sync().catch(() => undefined);

    return { message: "VNDB sync started" };
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("games/parse")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Re-fetch one VNDB-linked game from VNDB by MoonCellar id and link its characters",
  })
  @ApiQuery({ name: "gameId", required: true })
  @ApiOkResponse({ type: VndbParseResponseDto })
  parseGame(@Query("gameId") gameId: string) {
    return this.vndbService.parseGame(gameId);
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("link-related")
  @ApiOperation({
    summary:
      "Link related games for every VNDB game: resolve VNDB relations into game ids. Run it after a backfill",
  })
  linkRelatedGames() {
    if (this.vndbService.isLinkingRelatedGames) {
      return { message: "VNDB related games linking is already running" };
    }

    this.vndbService.linkVndbRelatedGames().catch(() => undefined);

    return { message: "VNDB related games linking started" };
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("characters/refresh")
  @ApiOperation({
    summary:
      "Re-fetch every VNDB character: upload portraits missing from storage and refresh traits",
  })
  refreshCharacters() {
    if (this.vndbService.isRefreshingVndbCharacters) {
      return { message: "VNDB characters refresh is already running" };
    }

    this.vndbService.refreshVndbCharacters().catch(() => undefined);

    return { message: "VNDB characters refresh started" };
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("candidates")
  @ApiOperation({
    summary:
      "Count VNs waiting for a match decision and decisions not yet written to games",
  })
  @ApiOkResponse({ type: VndbCandidatesSummaryDto })
  getCandidatesSummary() {
    return this.vndbService.getCandidatesSummary();
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("candidates/list")
  @ApiOperation({
    summary:
      "List candidate VNs with their state and candidate games, waiting ones first",
  })
  @ApiOkResponse({ type: VndbCandidatesResponseDto })
  getCandidates(@Query() dto: GetVndbCandidatesRequestDto) {
    return this.vndbService.getCandidates(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("candidates/:vnId")
  @ApiOperation({
    summary:
      "Get one candidate VN with its VNDB data, candidate games and the next VN to review",
  })
  @ApiOkResponse({ type: VndbReviewItemResponseDto })
  async getCandidate(@Param("vnId") vnId: string) {
    return { item: await this.vndbService.getCandidate(vnId) };
  }

  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("candidates/:vnId/decision")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Update a candidate game from VNDB, or create a new game for the VN; the decision is applied in the background",
  })
  @ApiOkResponse({ type: VndbCandidatesSummaryDto })
  decideCandidate(
    @Param("vnId") vnId: string,
    @Body() dto: DecideVndbCandidateRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.vndbService.decideCandidate(vnId, dto.gameId, request.user);
  }
}
