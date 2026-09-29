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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import mongoose from "mongoose";
import {
  AddGameDto,
  GameAiDraftDto,
  GameAiDraftRunDto,
  GameResponseDto,
  GetGameByIdDto,
  GetGameBySlugDto,
  GetGameResponseDto,
  GetGamesByIdsDto,
  GetGamesDto,
  GetGamesResponseDto,
  GetGameSlugsDto,
  GetGameSlugsResponseDto,
  GetRandomGameSlugResponseDto,
  GetRelatedGamesResponseDto,
  UpdateGameDto,
} from "../../../shared/zod/dto/games.dto";
import {
  GetGameFollowingsStatusRequestDto,
  GetGameFollowingsStatusResponseDto,
} from "../../../shared/zod/dto/game-followings-status.dto";
import {
  GetGamesStatsRequestDto,
  GetGameStatsResponseDto,
  GetGamesStatsResponseDto,
} from "../../../shared/zod/dto/game-stats.dto";
import { GamesService } from "../services/games.service";
import { GameAiDraftService } from "../services/game-ai-draft.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { RolesEnum } from "@mooncellar/schemas";
import { UserIdGuard } from "../../auth/user.guard";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  constructor(
    private readonly games: GamesService,
    private readonly gameAiDraft: GameAiDraftService
  ) {}

  @Get("/:gameId/followings-status")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Get followings status for a game" })
  @ApiCreatedResponse({ type: GetGameFollowingsStatusResponseDto })
  async getFollowingsStatus(
    @Param("gameId") gameId: string,
    @Query() dto: GetGameFollowingsStatusRequestDto
  ) {
    return this.games.getFollowingsStatus(gameId, dto);
  }

  @Get("/stats")
  @ApiOperation({ summary: "Get playthrough stats for games" })
  @ApiCreatedResponse({ type: GetGamesStatsResponseDto })
  async getGamesStats(@Query() dto: GetGamesStatsRequestDto) {
    return this.games.getGamesStats(dto.gameIds);
  }

  @Get("/:gameId/stats")
  @ApiOperation({ summary: "Get playthrough stats for a game" })
  @ApiCreatedResponse({ type: GetGameStatsResponseDto })
  async getGameStats(@Param("gameId") gameId: string) {
    return this.games.getGameStats(gameId);
  }

  @Get("/by-id/:id")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGameResponseDto })
  async getGameById(@Query() dto: GetGameByIdDto) {
    return this.games.getGameById(dto);
  }

  @Get("/by-ids")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGameByIds(@Query() dto: GetGamesByIdsDto) {
    return this.games.getGamesByIds(dto);
  }

  @Post("/by-ids")
  @ApiOperation({
    summary:
      "Get games by ids, optionally fuzzy-filtered by name within those ids. Use this instead of the GET variant when the id list is too long for a query string",
  })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGameByIdsPost(@Body() dto: GetGamesByIdsDto) {
    return this.games.getGamesByIds(dto);
  }

  @Get("/by-slug/:slug")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGameResponseDto })
  async getGameBySlug(@Query() dto: GetGameBySlugDto) {
    return this.games.getGameBySlug(dto);
  }

  @Get("/:gameId/related")
  @ApiOperation({ summary: "Get related games grouped by relation" })
  @ApiCreatedResponse({ type: GetRelatedGamesResponseDto })
  async getRelatedGames(@Param("gameId") gameId: string) {
    return this.games.getRelatedGames(gameId);
  }

  @Get("/top-rated-random")
  @ApiOperation({ summary: "Get 3 random top rated games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getTopRatedRandomGames() {
    return this.games.getTopRatedRandomGames();
  }

  @Get("/count-by-genre")
  @ApiOperation({ summary: "Get total games count grouped by genre" })
  @ApiCreatedResponse({
    description: "Array of objects with genre and count",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          genre: { type: "string" },
          count: { type: "number" },
        },
      },
    },
  })
  async getTotalGamesCountByGenre() {
    return this.games.getTotalGamesCountByGenre();
  }

  @Get("/upcoming")
  @ApiOperation({ summary: "Get upcoming releases grouped by quarter" })
  @ApiCreatedResponse({
    description: "Array of quarter groups with games",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          year: { type: "number" },
          quarter: { type: "number" },
          games: { type: "array", items: { type: "object" } },
        },
      },
    },
  })
  async getUpcomingReleases() {
    return this.games.getUpcomingReleases();
  }

  @Get("/slugs")
  @ApiOperation({
    summary: "Get slugs of all games",
    description:
      "Returns the `count` most popular game slugs (default 1000) by IGDB rating and rating count, plus the 100 most hyped releases of the next year. Used for sitemap generation.",
  })
  @ApiCreatedResponse({ type: GetGameSlugsResponseDto })
  async getAllSlugs(@Query() dto: GetGameSlugsDto) {
    return this.games.getAllSlugs(dto);
  }

  @Get("/random-slug")
  @ApiOperation({ summary: "Get a random game slug" })
  @ApiCreatedResponse({ type: GetRandomGameSlugResponseDto })
  async getRandomSlug() {
    return this.games.getRandomSlug();
  }

  @Get("/recent")
  @ApiOperation({ summary: "Get recently released games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getRecentReleases() {
    return this.games.getRecentReleases();
  }

  @Post("/")
  @ApiOperation({ summary: "Get games" })
  @ApiCreatedResponse({ type: GetGamesResponseDto })
  async getGames(@Body() dto: GetGamesDto) {
    return this.games.getGames(dto);
  }

  @Post("/add")
  @ApiOperation({ summary: "Add game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async addGame(@Body() dto: AddGameDto) {
    return this.games.addGame(dto);
  }

  @Get("/ai-drafts")
  @ApiOperation({ summary: "Get the latest AI game draft runs" })
  @ApiCreatedResponse({ type: [GameAiDraftRunDto] })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAiDrafts() {
    return this.gameAiDraft.getRuns();
  }

  @Post("/ai-drafts")
  @ApiOperation({
    summary: "Start an AI game draft",
    description:
      "Starts researching a game by name or link with OpenAI in the background and returns the run; poll GET /games/ai-drafts for its status and the unsaved add-game payload.",
  })
  @ApiCreatedResponse({ type: GameAiDraftRunDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async startAiDraft(@Body() dto: GameAiDraftDto) {
    return this.gameAiDraft.startRun(dto.query);
  }

  @Post("/ai-drafts/:id/retry")
  @ApiOperation({ summary: "Run a finished AI game draft again" })
  @ApiCreatedResponse({ type: GameAiDraftRunDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async retryAiDraft(@Param("id") id: string) {
    return this.gameAiDraft.retryRun(id);
  }

  @Delete("/ai-drafts/:id")
  @ApiOperation({ summary: "Delete a finished AI game draft run" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAiDraft(@Param("id") id: string) {
    return this.gameAiDraft.deleteRun(id);
  }

  @Put("/update/:id")
  @ApiOperation({ summary: "Update game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateGame(@Param("id") id: string, @Body() dto: UpdateGameDto) {
    return this.games.updateGame(new mongoose.Types.ObjectId(id), dto);
  }

  @Delete("/delete/:id")
  @ApiOperation({ summary: "Delete game" })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteGame(@Param("id") id: string) {
    return this.games.deleteGame(new mongoose.Types.ObjectId(id));
  }

  @Post("/parse-common")
  @ApiOperation({ summary: "Parse filters" })
  async parseCommon() {
    return this.games.parseFieldsToJson();
  }

  @Post("/upload-image/:id")
  @ApiOperation({ summary: "Upload image" })
  @ApiCreatedResponse({ type: String })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiQuery({
    name: "type",
    type: String,
    enum: ["cover", "screenshot", "artwork"],
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async uploadImage(
    @Query("gameId") gameId: string,
    @Query("type") type: "cover" | "screenshot" | "artwork",
    @UploadedFile() image: Express.Multer.File
  ) {
    return this.games.uploadImage(
      new mongoose.Types.ObjectId(gameId),
      image,
      type
    );
  }
}
