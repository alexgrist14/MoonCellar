import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GameDefinitionDto } from "../shared/zod/dto/game.dto";
import { GAMES, describeGame } from "./games";

@ApiTags("Games")
@Controller("games")
export class GamesController {
  @Get()
  @ApiOperation({ summary: "Games the service keeps leaderboards for" })
  @ApiOkResponse({ type: [GameDefinitionDto] })
  list() {
    return GAMES.map(describeGame);
  }
}
