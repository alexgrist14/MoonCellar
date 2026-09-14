import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
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
  GetReviewsRequestDto,
  ReviewsResponseDto,
  VoteResponseDto,
} from "../../../shared/zod/dto/comments.dto";
import { OptionalJwtGuard } from "../../auth/optional-jwt.guard";
import { UserIdGuard } from "../../auth/user.guard";
import { ReviewsService } from "../services/reviews.service";
import type {
  IAuthorizedRequest,
  ICommunityRequest,
} from "../types/community.type";

@ApiTags("Reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get("games/:gameId/reviews")
  @ApiOperation({ summary: "Get public playthrough reviews of a game" })
  @ApiCreatedResponse({ type: ReviewsResponseDto })
  @UseGuards(OptionalJwtGuard)
  async getReviews(
    @Param("gameId") gameId: string,
    @Query() dto: GetReviewsRequestDto,
    @Req() request: ICommunityRequest
  ) {
    return this.reviews.getReviews(gameId, dto, request.user);
  }

  @Put("reviews/:id/helpful")
  @ApiOperation({ summary: "Mark a review as helpful" })
  @ApiCreatedResponse({ type: VoteResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async markHelpful(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.reviews.setHelpful(id, request.user, true);
  }

  @Delete("reviews/:id/helpful")
  @ApiOperation({ summary: "Remove the helpful mark from a review" })
  @ApiCreatedResponse({ type: VoteResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async unmarkHelpful(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.reviews.setHelpful(id, request.user, false);
  }
}
