import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
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
import { UserRatingsService } from "../services/user-ratings.service";
import {
  AddUserRatingDto,
  GetUserRatingDto,
  RemoveUserRatingDto,
  UpdateUserRatingDto,
} from "src/shared/zod/dto/user-ratings.dto";

@ApiTags("User Ratings")
@Controller("ratings")
export class UserRatingsController {
  constructor(private readonly userRatingsService: UserRatingsService) {}

  @Post("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Add rating" })
  @ApiResponse({ status: 200, description: "Success" })
  async addRating(@Body() dto: AddUserRatingDto) {
    return await this.userRatingsService.addRating(dto);
  }

  @Put("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update rating" })
  @ApiResponse({ status: 200, description: "Success" })
  async updateRating(@Body() dto: UpdateUserRatingDto) {
    return await this.userRatingsService.updateRating(dto);
  }

  @Delete("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove rating" })
  @ApiResponse({ status: 200, description: "Success" })
  async removeRating(@Query() dto: RemoveUserRatingDto) {
    return await this.userRatingsService.removeRating(dto);
  }

  @Get("/")
  @ApiOperation({ summary: "Get ratings" })
  @ApiResponse({ status: 200, description: "Success" })
  async getRatings(@Query() dto: GetUserRatingDto) {
    return await this.userRatingsService.getRatings(dto);
  }

  @Post("/recalculate")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({
    summary: "Recalculate average rating and ratings count for all games",
  })
  @ApiResponse({ status: 200, description: "Success" })
  async recalculateAllAverageRatings() {
    return await this.userRatingsService.recalculateAllAverageRatings();
  }
}
