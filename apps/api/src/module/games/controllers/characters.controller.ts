import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { CharactersService } from "../services/characters.service";
import { GameAiDraftService } from "../services/game-ai-draft.service";
import {
  FindCharacterPortraitsDto,
  FindCharacterPortraitsResponseDto,
  CharacterAiDraftDto,
  CharacterAiDraftRunDto,
  CharacterResponseDto,
  GetCharacterBySlugDto,
  GetCharactersDto,
  GetCharactersResponseDto,
} from "../../../shared/zod/dto/characters.dto";
import {
  GetAdminCharactersDto,
  GetAdminCharactersResponseDto,
  SaveCharacterDto,
} from "../../../shared/zod/dto/content-requests.dto";

@ApiTags("Characters")
@Controller("characters")
export class CharactersController {
  constructor(
    private readonly characters: CharactersService,
    private readonly aiDrafts: GameAiDraftService
  ) {}

  @Get("/")
  @ApiOperation({ summary: "Get characters" })
  @ApiCreatedResponse({ type: GetCharactersResponseDto })
  async getCharacters(@Query() query: GetCharactersDto) {
    return this.characters.getCharacters(query);
  }

  @Get("/admin")
  @ApiOperation({ summary: "Characters for the admin, with a total count" })
  @ApiOkResponse({ type: GetAdminCharactersResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAdminCharacters(@Query() query: GetAdminCharactersDto) {
    return this.characters.getAdminCharacters(query as never);
  }

  @Post("/portraits")
  @ApiOperation({
    summary:
      "Search images for a character portrait and return the links that download",
  })
  @ApiOkResponse({ type: FindCharacterPortraitsResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async findPortraits(@Body() dto: FindCharacterPortraitsDto) {
    return this.characters.findPortraits(dto);
  }

  @Get("/ai-drafts")
  @ApiOperation({ summary: "Get the latest AI character draft runs" })
  @ApiOkResponse({ type: [CharacterAiDraftRunDto] })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAiDrafts() {
    return this.aiDrafts.getRuns("character");
  }

  @Post("/ai-drafts")
  @ApiOperation({
    summary: "Start an AI character draft",
    description:
      "Researches a character by name or link with OpenAI in the background and returns the run; poll GET /characters/ai-drafts for its status and the unsaved character payload.",
  })
  @ApiOkResponse({ type: CharacterAiDraftRunDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async startAiDraft(@Body() dto: CharacterAiDraftDto) {
    return this.aiDrafts.startRun(dto.query, "character", dto.count);
  }

  @Post("/ai-drafts/:id/retry")
  @ApiOperation({ summary: "Run a finished AI character draft again" })
  @ApiOkResponse({ type: CharacterAiDraftRunDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async retryAiDraft(@Param("id") id: string) {
    return this.aiDrafts.retryRun(id);
  }

  @Delete("/ai-drafts/:id")
  @ApiOperation({ summary: "Delete a finished AI character draft run" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAiDraft(@Param("id") id: string) {
    return this.aiDrafts.deleteRun(id);
  }

  @Post("/")
  @ApiOperation({ summary: "Create a character" })
  @ApiOkResponse({ type: CharacterResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async createCharacter(@Body() dto: SaveCharacterDto) {
    return this.characters.saveCharacter(undefined, dto);
  }

  @Patch("/:id")
  @ApiOperation({ summary: "Update a character" })
  @ApiOkResponse({ type: CharacterResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async updateCharacter(
    @Param("id") id: string,
    @Body() dto: SaveCharacterDto
  ) {
    return this.characters.saveCharacter(id, dto);
  }

  @Delete("/:id")
  @ApiOperation({ summary: "Delete a character" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async deleteCharacter(@Param("id") id: string) {
    return this.characters.deleteCharacter(id);
  }

  @Post("/:id/image")
  @ApiOperation({ summary: "Upload a character portrait" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  async uploadCharacterImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.characters.uploadCharacterImage(id, file);
  }

  @Get("/:slug")
  @ApiOperation({ summary: "Get character by slug" })
  @ApiCreatedResponse({ type: CharacterResponseDto })
  async getCharacterBySlug(@Param() params: GetCharacterBySlugDto) {
    return this.characters.getCharacterBySlug(params);
  }
}
