import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  SearchUsersDto,
  SearchUsersResponseDto,
} from "../../../shared/zod/dto/user.dto";
import { OptionalJwtGuard } from "../../auth/optional-jwt.guard";
import { UsersSearchService } from "../services/users-search.service";
import type { IOptionalViewerRequest } from "../types/collections.type";

@ApiTags("Users Search")
@Controller("users")
export class UsersSearchController {
  constructor(private readonly usersSearch: UsersSearchService) {}

  @Get("search")
  @ApiOperation({ summary: "Find users by part of the user name" })
  @ApiCreatedResponse({ type: SearchUsersResponseDto })
  @UseGuards(OptionalJwtGuard)
  async searchUsers(
    @Query() dto: SearchUsersDto,
    @Req() request: IOptionalViewerRequest
  ) {
    return this.usersSearch.searchUsers(dto, request.user);
  }
}
