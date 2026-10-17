import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  GameChallengeCreateDto,
  GameChallengeDto,
  GameChallengeParamsDto,
  GameChallengeWithReplayDto,
  GameParamsDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { ChallengesService } from "./challenges.service";

@ApiTags("Challenges")
@ApiBearerAuth()
@UseGuards(GameTokenGuard)
@Controller("games/:game/challenges")
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Post()
  @ApiOperation({
    summary: "Challenge a friend with a score, its replay and a comment",
  })
  @ApiCreatedResponse({ type: GameChallengeDto })
  create(
    @Param() params: GameParamsDto,
    @Body() dto: GameChallengeCreateDto,
    @Req() request: IGameRequest
  ) {
    return this.challenges.create(
      findGame(params.game, dto.board),
      request.account,
      dto
    );
  }

  @Get("incoming")
  @ApiOperation({
    summary: "Challenges sent to this player since the last call, oldest first",
  })
  @ApiOkResponse({ type: [GameChallengeDto] })
  incoming(@Param() params: GameParamsDto, @Req() request: IGameRequest) {
    return this.challenges.takeIncoming(findGame(params.game), request.account);
  }

  @Get(":challengeId")
  @ApiOperation({ summary: "A challenge with its replay, to play it" })
  @ApiOkResponse({ type: GameChallengeWithReplayDto })
  get(@Param() params: GameChallengeParamsDto, @Req() request: IGameRequest) {
    return this.challenges.get(
      findGame(params.game),
      request.account,
      params.challengeId
    );
  }
}
