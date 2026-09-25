import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  AddFavoriteDto,
  GetFavoriteCharactersResponseDto,
  UpdateFavoriteCharactersDto,
  UpdateFavoriteCharactersResponseDto,
  UpdateFavoritesDto,
  UpdateFavoritesResponseDto,
} from "../../../shared/zod/dto/user.dto";
import { UserIdGuard } from "../../auth/user.guard";
import { FavoritesService } from "../services/favorites.service";

@ApiTags("User Favourites")
@Controller("user")
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get(":userId/favorites")
  @ApiOperation({ summary: "Favourite game ids in the owner's order" })
  @ApiCreatedResponse({ type: UpdateFavoritesResponseDto })
  async getFavorites(@Param("userId") userId: string) {
    return this.favorites.getFavoriteIds(userId);
  }

  @Patch(":userId/favorites")
  @ApiOperation({ summary: "Replace the favourites with an ordered list" })
  @ApiCreatedResponse({ type: UpdateFavoritesResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async updateFavorites(
    @Param("userId") userId: string,
    @Body() dto: UpdateFavoritesDto
  ) {
    return this.favorites.updateFavorites(userId, dto);
  }

  @Post(":userId/favorites/:gameId")
  @ApiOperation({
    summary: "Add a game to the favourites, or swap it for replaceGameId",
  })
  @ApiCreatedResponse({ type: UpdateFavoritesResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async addFavorite(
    @Param("userId") userId: string,
    @Param("gameId") gameId: string,
    @Body() dto: AddFavoriteDto
  ) {
    return this.favorites.addFavorite(userId, gameId, dto);
  }

  @Delete(":userId/favorites/:gameId")
  @ApiOperation({ summary: "Remove a game from the favourites" })
  @ApiCreatedResponse({ type: UpdateFavoritesResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async removeFavorite(
    @Param("userId") userId: string,
    @Param("gameId") gameId: string
  ) {
    return this.favorites.removeFavorite(userId, gameId);
  }

  @Get(":userId/favorite-characters")
  @ApiOperation({ summary: "Favourite characters in the owner's order" })
  @ApiCreatedResponse({ type: GetFavoriteCharactersResponseDto })
  async getFavoriteCharacters(@Param("userId") userId: string) {
    return this.favorites.getFavoriteCharacters(userId);
  }

  @Patch(":userId/favorite-characters")
  @ApiOperation({
    summary: "Replace the favourite characters with an ordered list",
  })
  @ApiCreatedResponse({ type: UpdateFavoriteCharactersResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async updateFavoriteCharacters(
    @Param("userId") userId: string,
    @Body() dto: UpdateFavoriteCharactersDto
  ) {
    return this.favorites.updateFavoriteCharacters(userId, dto);
  }

  @Post(":userId/favorite-characters/:characterId")
  @ApiOperation({ summary: "Add a character to the favourites" })
  @ApiCreatedResponse({ type: UpdateFavoriteCharactersResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async addFavoriteCharacter(
    @Param("userId") userId: string,
    @Param("characterId") characterId: string
  ) {
    return this.favorites.addFavoriteCharacter(userId, characterId);
  }

  @Delete(":userId/favorite-characters/:characterId")
  @ApiOperation({ summary: "Remove a character from the favourites" })
  @ApiCreatedResponse({ type: UpdateFavoriteCharactersResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  async removeFavoriteCharacter(
    @Param("userId") userId: string,
    @Param("characterId") characterId: string
  ) {
    return this.favorites.removeFavoriteCharacter(userId, characterId);
  }
}
