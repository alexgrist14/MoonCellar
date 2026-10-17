import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { findGame } from "../../games/games";
import {
  GameLevelDto,
  GameLevelFileDto,
  GameLevelListDto,
  GameLevelListQueryDto,
  GameLevelModerationDto,
  GameLevelParamsDto,
  GameLevelRatingDto,
  GameLevelReportDto,
  GameLevelReportResultDto,
  GameLevelReportedDto,
  GameLevelUploadDto,
  GameParamsDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { LevelsService } from "./levels.service";
import { ModerationGuard } from "./moderation.guard";

@ApiTags("Levels")
@Controller("games/:game/levels")
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get()
  @ApiOperation({ summary: "Player levels, newest or best rated first" })
  @ApiOkResponse({ type: GameLevelListDto })
  list(@Param() params: GameParamsDto, @Query() query: GameLevelListQueryDto) {
    return this.levels.list(findGame(params.game), query);
  }

  @Get("reported")
  @ApiOperation({ summary: "Reported and hidden levels, for moderators" })
  @ApiOkResponse({ type: [GameLevelReportedDto] })
  @ApiBearerAuth()
  @UseGuards(ModerationGuard)
  reported(@Param() params: GameParamsDto) {
    return this.levels.reported(findGame(params.game));
  }

  @Get(":levelId")
  @ApiOperation({ summary: "A player level" })
  @ApiOkResponse({ type: GameLevelDto })
  get(@Param() params: GameLevelParamsDto) {
    return this.levels.get(findGame(params.game), params.levelId);
  }

  @Get(":levelId/file")
  @ApiOperation({ summary: "The level's map file; counts a download" })
  @ApiOkResponse({ type: GameLevelFileDto })
  file(@Param() params: GameLevelParamsDto) {
    return this.levels.file(findGame(params.game), params.levelId);
  }

  @Post()
  @ApiOperation({ summary: "Upload a level the player made" })
  @ApiCreatedResponse({ type: GameLevelDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  upload(
    @Param() params: GameParamsDto,
    @Body() dto: GameLevelUploadDto,
    @Req() request: IGameRequest
  ) {
    return this.levels.upload(findGame(params.game), request.account, dto);
  }

  @Put(":levelId")
  @ApiOperation({ summary: "Upload a new version of the player's own level" })
  @ApiOkResponse({ type: GameLevelDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  update(
    @Param() params: GameLevelParamsDto,
    @Body() dto: GameLevelUploadDto,
    @Req() request: IGameRequest
  ) {
    return this.levels.update(
      findGame(params.game),
      request.account,
      params.levelId,
      dto
    );
  }

  @Delete(":levelId")
  @ApiOperation({ summary: "Delete the player's own level" })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  remove(@Param() params: GameLevelParamsDto, @Req() request: IGameRequest) {
    return this.levels.remove(
      findGame(params.game),
      request.account,
      params.levelId
    );
  }

  @Put(":levelId/rating")
  @ApiOperation({ summary: "Rate a level, one to five stars; replaces the player's rating" })
  @ApiOkResponse({ type: GameLevelDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  rate(
    @Param() params: GameLevelParamsDto,
    @Body() dto: GameLevelRatingDto,
    @Req() request: IGameRequest
  ) {
    return this.levels.rate(
      findGame(params.game),
      request.account,
      params.levelId,
      dto.stars
    );
  }

  @Post(":levelId/report")
  @ApiOperation({ summary: "Report a level; three reports hide it" })
  @ApiOkResponse({ type: GameLevelReportResultDto })
  @ApiBearerAuth()
  @UseGuards(GameTokenGuard)
  @HttpCode(HttpStatus.OK)
  report(
    @Param() params: GameLevelParamsDto,
    @Body() dto: GameLevelReportDto,
    @Req() request: IGameRequest
  ) {
    return this.levels.report(
      findGame(params.game),
      request.account,
      params.levelId,
      dto.reason
    );
  }

  @Put(":levelId/moderation")
  @ApiOperation({ summary: "Hide or show a level, for moderators" })
  @ApiOkResponse({ type: GameLevelDto })
  @ApiBearerAuth()
  @UseGuards(ModerationGuard)
  moderate(
    @Param() params: GameLevelParamsDto,
    @Body() dto: GameLevelModerationDto
  ) {
    return this.levels.moderate(
      findGame(params.game),
      params.levelId,
      dto.hidden
    );
  }
}
