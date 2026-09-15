import {
  ApiOperation,
  ApiCreatedResponse,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { VndbService } from "../services/vndb.service";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";

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
}
