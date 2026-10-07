import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type mongoose from "mongoose";
import { UserIdGuard } from "../../auth/user.guard";
import type { IViewerRequest } from "../../collections/types/collections.type";
import {
  AddGauntletHistoryDto,
  GauntletHistoryGameParamsDto,
  GetGauntletHistoryDto,
} from "../../../shared/zod/dto/gauntlet-history.dto";
import { UserGauntletHistoryService } from "../services/user-gauntlet-history.service";

const viewerId = (request: IViewerRequest) =>
  request.user._id as mongoose.Types.ObjectId;

@ApiTags("Gauntlet History")
@ApiCookieAuth()
@UseGuards(AuthGuard("jwt"), UserIdGuard)
@Controller("gauntlet-history")
export class UserGauntletHistoryController {
  constructor(private readonly history: UserGauntletHistoryService) {}

  @Get("/")
  @ApiOperation({ summary: "Won games of the viewer, newest first, paged" })
  @ApiResponse({ status: 200, description: "{ total, results }" })
  getHistory(
    @Query() { page, take }: GetGauntletHistoryDto,
    @Req() request: IViewerRequest
  ) {
    return this.history.getHistory(viewerId(request), page, take);
  }

  @Get("/ids")
  @ApiOperation({ summary: "Ids of every game in the viewer's history" })
  @ApiResponse({ status: 200, description: "Game ids" })
  getHistoryIds(@Req() request: IViewerRequest) {
    return this.history.getHistoryIds(viewerId(request));
  }

  @Post("/")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Add won games, newest first" })
  addGames(
    @Body() { gameIds }: AddGauntletHistoryDto,
    @Req() request: IViewerRequest
  ) {
    return this.history.addGames(viewerId(request), gameIds);
  }

  @Delete("/:gameId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove one game from the history" })
  removeGame(
    @Param() { gameId }: GauntletHistoryGameParamsDto,
    @Req() request: IViewerRequest
  ) {
    return this.history.removeGame(viewerId(request), gameId);
  }

  @Delete("/")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Clear the history" })
  clear(@Req() request: IViewerRequest) {
    return this.history.clear(viewerId(request));
  }
}
