import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type mongoose from "mongoose";
import { UserIdGuard } from "../../auth/user.guard";
import type { IViewerRequest } from "../../collections/types/collections.type";
import {
  RaConnectRequestDto,
  RaConnectResponseDto,
  RaUserGamesResponseDto,
} from "../../../shared/zod/dto/user.dto";
import { UserRAService } from "../services/user-ra.service";

@ApiTags("User RA")
@Controller("user")
export class UserRAController {
  constructor(private readonly userRAService: UserRAService) {}

  @Get("/ra/:raUsername")
  @ApiOperation({ summary: "Get RA user achievements" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getAchievements(@Param("raUsername") raUsername: string) {
    return this.userRAService.getUserAchievements(raUsername);
  }

  @Get("/ra/:userId/games")
  @ApiOperation({
    summary:
      "Catalogue games the user has a RetroAchievements award for, with the best status",
  })
  @ApiOkResponse({ type: RaUserGamesResponseDto })
  getUserGames(@Param("userId") userId: string) {
    return this.userRAService.getUserGames(userId);
  }

  @Post("/ra/connect")
  @ApiOperation({
    summary:
      "Start connecting a RetroAchievements account: returns the code to put in the RA motto",
  })
  @ApiOkResponse({ type: RaConnectResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  startConnect(
    @Body() dto: RaConnectRequestDto,
    @Req() request: IViewerRequest
  ) {
    return this.userRAService.startConnect(
      request.user._id as mongoose.Types.ObjectId,
      dto.username
    );
  }

  @Post("/ra/verify")
  @ApiOperation({
    summary:
      "Check the RA motto for the code and connect the account with its awards",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  verifyConnect(@Req() request: IViewerRequest) {
    return this.userRAService.verifyConnect(
      request.user._id as mongoose.Types.ObjectId
    );
  }

  @Post("/ra/sync")
  @ApiOperation({
    summary: "Reload the connected RetroAchievements account's awards",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  syncAwards(@Req() request: IViewerRequest) {
    return this.userRAService.syncAwards(
      request.user._id as mongoose.Types.ObjectId
    );
  }

  @Post("/ra/playthroughs/sync")
  @ApiOperation({
    summary:
      "Create playthroughs from the stored RetroAchievements awards, if the user turned it on",
  })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  syncPlaythroughs(@Req() request: IViewerRequest) {
    return this.userRAService.syncPlaythroughs(
      request.user._id as mongoose.Types.ObjectId
    );
  }

  @Delete("/ra")
  @ApiOperation({ summary: "Disconnect the RetroAchievements account" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  disconnect(@Req() request: IViewerRequest) {
    return this.userRAService.disconnect(
      request.user._id as mongoose.Types.ObjectId
    );
  }
}
