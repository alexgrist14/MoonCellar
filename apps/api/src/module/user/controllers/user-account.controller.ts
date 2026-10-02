import {
  Body,
  Controller,
  Delete,
  Headers,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { DeleteAccountDto } from "../../../shared/zod/dto/user.dto";
import { UserIdGuard } from "../../auth/user.guard";
import { clearAuthCookies } from "../../auth/auth-cookies";
import { AccountDeletionService } from "../services/account-deletion.service";

@ApiTags("User Profile")
@Controller("user")
export class UserAccountController {
  constructor(private readonly accountDeletionService: AccountDeletionService) {}

  @Delete("account/:userId")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Delete own account and all its data" })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 403, description: "Password does not match" })
  async deleteAccount(
    @Param("userId") userId: string,
    @Body() { password }: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
    @Headers("origin") origin?: string
  ) {
    await this.accountDeletionService.deleteOwnAccount(userId, password);
    clearAuthCookies(res, origin);

    return { success: true };
  }
}
