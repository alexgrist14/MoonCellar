import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
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
}
