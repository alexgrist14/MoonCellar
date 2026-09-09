import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CharactersService } from "../services/characters.service";
import {
  CharacterResponseDto,
  GetCharacterBySlugDto,
  GetCharactersDto,
  GetCharactersResponseDto,
} from "../../../shared/zod/dto/characters.dto";

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

  @Get("/:slug")
  @ApiOperation({ summary: "Get character by slug" })
  @ApiCreatedResponse({ type: CharacterResponseDto })
  async getCharacterBySlug(@Param() params: GetCharacterBySlugDto) {
    return this.characters.getCharacterBySlug(params);
  }
}
