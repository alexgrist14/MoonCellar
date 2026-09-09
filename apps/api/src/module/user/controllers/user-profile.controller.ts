import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RolesGuard } from "src/module/roles/roles.guard";
import {
  GetUserByStringDto,
  GetUserLoginsResponseDto,
  UpdateDescriptionDto,
  UpdateSettingsDto,
  UpdateUserEmailDto,
  UpdateUserPasswordDto,
} from "src/shared/zod/dto/user.dto";
import { IGetUserLoginsResponse } from "src/shared/zod/schemas/user.schema";
import { UserIdGuard } from "../../auth/user.guard";
import { User } from "../schemas/user.schema";
import { UserProfileService } from "../services/user-profile.service";

@ApiTags("User Profile")
@Controller("user")
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get("search")
  @ApiOperation({ summary: "Get user by name or email" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  @ApiQuery({ name: "searchString", required: true })
  findByString(@Query() query: GetUserByStringDto): Promise<User> {
    return this.userProfileService.findByString(query);
  }

  @Get("logins")
  @ApiOperation({ summary: "Get all user logins (for sitemap generation)" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  @ApiCreatedResponse({ type: GetUserLoginsResponseDto })
  async findAllLogins(): Promise<IGetUserLoginsResponse> {
    return this.userProfileService.findAllLogins();
  }

  @Get(":userId")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async findById(@Param("userId") userId: string): Promise<User> {
    return this.userProfileService.findById(userId);
  }

  @Patch("email/:userId")
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update user email" })
  @ApiResponse({ status: 201, description: "success" })
  async updateEmail(
    @Param("userId") userId: string,
    @Body() updateEmailDto: UpdateUserEmailDto
  ): Promise<User> {
    return this.userProfileService.updateEmail(userId, updateEmailDto);
  }

  @Patch("password/:userId")
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update user password" })
  @ApiResponse({ status: 201, description: "Success" })
  async updatePassword(
    @Param("userId") userId: string,
    @Body() updatePasswordDto: UpdateUserPasswordDto
  ): Promise<User> {
    return this.userProfileService.updatePassword(userId, updatePasswordDto);
  }

  @Patch("avatar")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Add user avatar" })
  @ApiResponse({ status: 201, description: "picture name" })
  @ApiConsumes("multipart/form-data")
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
  async uploadAvatar(
    @Query("userId") userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!userId) return;

    return this.userProfileService.updateAvatar(userId, file);
  }

  @Patch("background")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Add user background" })
  @ApiResponse({ status: 201, description: "picture name" })
  @ApiConsumes("multipart/form-data")
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
  async uploadBackground(
    @Query("userId") userId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.userProfileService.updateBackground(userId, file);
  }

  @Patch("description/:userId")
  @UseGuards(RolesGuard)
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update user description" })
  @ApiResponse({ status: 200, description: "Success" })
  async updateDescription(
    @Param("userId") userId: string,
    @Body() descriptionDto: UpdateDescriptionDto
  ) {
    return await this.userProfileService.updateUserDescription(
      userId,
      descriptionDto
    );
  }

  @Patch("settings/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update user settings" })
  @ApiResponse({ status: 200, description: "Success" })
  async updateSettings(
    @Param("userId") userId: string,
    @Body() settingsDto: UpdateSettingsDto
  ) {
    return await this.userProfileService.updateSettings(userId, settingsDto);
  }

  @Patch("profile-time/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Update user updatedAt field" })
  @ApiResponse({ status: 200, description: "Success" })
  async updateUserTime(@Param("userId") userId: string) {
    return await this.userProfileService.updateUserTime(userId);
  }
}
