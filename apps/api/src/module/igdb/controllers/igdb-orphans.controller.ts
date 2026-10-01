import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiAcceptedResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { IgdbOrphansService } from "../igdb-orphans.service";
import {
  IgdbOrphansRunDto,
  StartIgdbOrphansRequestDto,
} from "../../../shared/zod/dto/igdb-orphans.dto";

@ApiTags("IGDB")
@Controller("igdb")
export class IgdbOrphansController {
  constructor(private readonly service: IgdbOrphansService) {}

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/orphans")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Start a background run that finds games whose IGDB entry no longer exists and deletes the ones nobody uses. VNDB-owned and hand-made games are only unlinked, games with user data are kept. Runs every Monday at 02:00 (Europe/Moscow) in apply mode",
  })
  @ApiAcceptedResponse({ type: IgdbOrphansRunDto })
  @ApiConflictResponse({ description: "A run is already running" })
  start(@Body() dto: StartIgdbOrphansRequestDto) {
    return this.service.start(dto);
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("/orphans")
  @ApiOperation({
    summary: "Read the state and report of the last IGDB orphan run",
  })
  @ApiOkResponse({ type: IgdbOrphansRunDto })
  getState() {
    return this.service.getState();
  }
}
