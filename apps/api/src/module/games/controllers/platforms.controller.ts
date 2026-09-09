import { Controller, Get } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PlatformsService } from "../services/platforms.service";
import { PlatformResponseDto } from "src/shared/zod/dto/platforms.dto";

@ApiTags("Platforms")
@Controller("platforms")
export class PlatformsController {
  constructor(private readonly platforms: PlatformsService) {}

  @Get("/")
  @ApiOperation({ summary: "Get platforms" })
  @ApiCreatedResponse({ type: PlatformResponseDto })
  async getPlatforms() {
    return this.platforms.getPlatforms();
  }
}
