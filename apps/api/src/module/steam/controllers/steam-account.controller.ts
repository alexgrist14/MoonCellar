import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type mongoose from "mongoose";
import { UserIdGuard } from "../../auth/user.guard";
import type { IViewerRequest } from "../../collections/types/collections.type";
import {
  LinkSteamAccountRequestDto,
  SteamLoginUrlResponseDto,
  SteamSyncResponseDto,
  UnlinkSteamAccountResponseDto,
} from "../../../shared/zod/dto/steam.dto";
import { SteamAccountService } from "../services/steam-account.service";

@ApiTags("Steam account")
@Controller("steam/account")
export class SteamAccountController {
  constructor(private readonly service: SteamAccountService) {}

  @Get("login-url")
  @ApiOperation({
    summary: "Steam sign-in page that returns to the viewer's settings",
  })
  @ApiOkResponse({ type: SteamLoginUrlResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  getLoginUrl(@Req() request: IViewerRequest) {
    return this.service.getLoginUrl(request.user);
  }

  @Post("link")
  @ApiOperation({
    summary:
      "Verify the Steam sign-in, link the account and import its library as a list",
  })
  @ApiOkResponse({ type: SteamSyncResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  link(
    @Body() dto: LinkSteamAccountRequestDto,
    @Req() request: IViewerRequest
  ) {
    return this.service.link(request.user, dto.params);
  }

  @Post("sync")
  @ApiOperation({ summary: "Import the linked Steam library again" })
  @ApiOkResponse({ type: SteamSyncResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  sync(@Req() request: IViewerRequest) {
    return this.service.sync(request.user._id as mongoose.Types.ObjectId);
  }

  @Delete()
  @ApiOperation({
    summary: "Unlink the Steam account and delete its library list",
  })
  @ApiOkResponse({ type: UnlinkSteamAccountResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  unlink(@Req() request: IViewerRequest) {
    return this.service.unlink(request.user._id as mongoose.Types.ObjectId);
  }
}
