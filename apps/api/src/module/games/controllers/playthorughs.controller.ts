import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import mongoose from "mongoose";
import {
  GetPlaythroughFullResponseDto,
  GetPlaythroughsMinimalResponseDto,
  GetPlaythroughsRequestDto,
  GetPlaythroughsResponseDto,
  SavePlaythroughRequestDto,
  UpdatePlaythroughsRequestDto,
} from "src/shared/zod/dto/playthroughs.dto";
import { PlaythroughsService } from "../services/playthroughs.service";
import { UserIdGuard } from "src/module/auth/user.guard";

@ApiTags("Playthroughs")
@Controller("playthroughs")
export class PlaythroughsController {
  constructor(private readonly playthroughs: PlaythroughsService) {}

  @Get("/")
  @ApiOperation({ summary: "Get playthroughs" })
  @ApiCreatedResponse({ type: GetPlaythroughsResponseDto })
  async getPlaythroughsController(@Query() dto: GetPlaythroughsRequestDto) {
    return this.playthroughs.getPlaythroughs(dto);
  }

  @Get("/minimal")
  @ApiOperation({ summary: "Get playthroughs (minimal)" })
  @ApiCreatedResponse({ type: GetPlaythroughsMinimalResponseDto })
  async getPlaythroughsMinimalController(
    @Query() dto: GetPlaythroughsRequestDto
  ) {
    return this.playthroughs.getPlaythroughsMinimal(dto);
  }

  @Post("/save")
  @ApiOperation({ summary: "Save playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async savePlaythroughController(@Body() dto: SavePlaythroughRequestDto) {
    return this.playthroughs.savePlaythrough(dto);
  }

  @Put("/update/:userId/:id")
  @ApiOperation({ summary: "Update playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async updatePlaythroughController(
    @Param("id") id: string,
    @Body() dto: UpdatePlaythroughsRequestDto
  ) {
    return this.playthroughs.updatePlaythrough(
      new mongoose.Types.ObjectId(id),
      dto
    );
  }

  @Delete("/delete/:userId/:id")
  @ApiOperation({ summary: "Delete playthrough" })
  @ApiCreatedResponse({ type: GetPlaythroughFullResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async deletePlaythroughController(@Param("id") id: string) {
    return this.playthroughs.deletePlaythrough(new mongoose.Types.ObjectId(id));
  }
}
