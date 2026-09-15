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
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import {
  DecideVndbCandidateRequestDto,
  GetNextVndbCandidateRequestDto,
  NextVndbCandidateResponseDto,
  VndbCandidatesSummaryDto,
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
    description: "Start after this VNDB id (e.g. v30000) to resume a run",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Stop after this many VNs, for test runs",
  })
  backFill(
    @Query("fromVnId") fromVnId?: string,
    @Query("limit") limit?: string
  ) {
    if (this.vndbService.isSyncRunning) {
      return { message: "VNDB sync is already running" };
    }

    this.vndbService
      .backFill({ fromVnId, limit: limit ? Number(limit) : undefined })
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
  @Get("candidates/next")
  @ApiOperation({
    summary:
      "Get the next VN waiting for a match decision, with its VNDB data and candidate games",
  })
  @ApiOkResponse({ type: NextVndbCandidateResponseDto })
  async getNextCandidate(@Query() dto: GetNextVndbCandidateRequestDto) {
    return { item: await this.vndbService.getNextCandidate(dto.after) };
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
    @Body() dto: DecideVndbCandidateRequestDto
  ) {
    return this.vndbService.decideCandidate(vnId, dto.gameId);
  }
}
