import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from "@nestjs/swagger";
import { UserIdGuard } from "src/module/auth/user.guard";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { RolesEnum } from "src/shared/zod/schemas/role.schema";
import { UserFollowingsService } from "../services/user-followings.service";

@ApiTags("User Followings")
@Controller("user")
export class UserFollowingsController {
  constructor(private readonly userFollowingsService: UserFollowingsService) {}

  @Get("/followings/:userId")
  @ApiOperation({ summary: "Get user followings" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getUserFollowings(@Param("userId") userId: string) {
    return this.userFollowingsService.getUserFollowings(userId);
  }

  @Get("/followers/:userId")
  @ApiOperation({ summary: "Get user followers" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getUserFollowers(@Param("userId") userId: string) {
    return this.userFollowingsService.getUserFollowers(userId);
  }

  @Post("/followers/recalculate")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: "Recalculate followers for all users" })
  @ApiResponse({ status: 200, description: "Success" })
  async recalculateAllFollowers() {
    return this.userFollowingsService.recalculateAllFollowers();
  }

  @Patch("/followings/:userId/:followingId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Add following to user" })
  @ApiResponse({ status: 200, description: "success" })
  async addUserFollowing(
    @Param("userId") userId: string,
    @Param("followingId") followingId: string
  ) {
    return this.userFollowingsService.addUserFollowing(userId, followingId);
  }

  @Delete("/followings/:userId/:followingId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove user following" })
  @ApiResponse({ status: 200, description: "success" })
  async removeUserFollowing(
    @Param("userId") userId: string,
    @Param("followingId") followingId: string
  ) {
    return this.userFollowingsService.removeUserFollowing(userId, followingId);
  }
}
