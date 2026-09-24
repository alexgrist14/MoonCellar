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
import {
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
  constructor(private readonly characters: CharactersService) {}

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
  async updateCharacter(@Param("id") id: string, @Body() dto: SaveCharacterDto) {
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
