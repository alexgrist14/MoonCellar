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
import {
  GameChallengeCreateDto,
  GameChallengeDto,
  GameChallengeParamsDto,
  GameChallengeWithGhostDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { ChallengesService } from "./challenges.service";

@ApiTags("Challenges")
@ApiBearerAuth()
@UseGuards(GameTokenGuard)
@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Post()
  @ApiOperation({
    summary: "Challenge a friend with a run: its time, ghost and a comment",
  })
  @ApiCreatedResponse({ type: GameChallengeDto })
  create(@Body() dto: GameChallengeCreateDto, @Req() request: IGameRequest) {
    return this.challenges.create(request.account, dto);
  }

  @Get("incoming")
  @ApiOperation({
    summary: "Challenges sent to this player since the last call, oldest first",
  })
  @ApiOkResponse({ type: [GameChallengeDto] })
  incoming(@Req() request: IGameRequest) {
    return this.challenges.takeIncoming(request.account);
  }

  @Get(":challengeId")
  @ApiOperation({ summary: "A challenge with its ghost, to race it" })
  @ApiOkResponse({ type: GameChallengeWithGhostDto })
  get(@Param() params: GameChallengeParamsDto, @Req() request: IGameRequest) {
    return this.challenges.get(request.account, params.challengeId);
  }
}
