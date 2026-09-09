import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UserIdGuard } from "src/module/auth/user.guard";
import { PresetDto } from "../dto/presets.dto";
import { UserPresetsService } from "../services/user-presets.service";

@ApiTags("User Presets")
@Controller("user")
export class UserPresetsController {
  constructor(private readonly userPresetsService: UserPresetsService) {}

  @Put("presets/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Save preset to user" })
  @ApiResponse({ status: 200, description: "Success" })
  async addFilter(
    @Param("userId") userId: string,
    @Body() presetDto: PresetDto
  ) {
    return await this.userPresetsService.addPreset(
      userId,
      presetDto.name,
      presetDto.preset
    );
  }

  @Delete("presets/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove preset from user" })
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFilter(
    @Param("userId") userId: string,
    @Query("name") name: string
  ) {
    return await this.userPresetsService.removePreset(userId, name);
  }

  @Get("presets/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Get user presets" })
  @ApiResponse({ status: 200, description: "Success" })
  async getFilters(@Param("userId") userId: string) {
    return await this.userPresetsService.getPresets(userId);
  }
}
