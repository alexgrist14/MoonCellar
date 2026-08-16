import { ApiOperation, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { VndbService } from "../services/vndb.service";
import { Body, Controller, Get, Post } from "@nestjs/common";

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

  @Post("backfill")
  @ApiOperation({ summary: "Backfill vns" })
  async backFill() {
    return this.vndbService.backFill();
  }
}
