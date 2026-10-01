import {
  BadRequestException,
  Body,
  Controller,
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
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ConflictSourceSchema,
  type IConflictSource,
  RolesEnum,
} from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import type { IAuthorizedRequest } from "../../comments/types/community.type";
import {
  ConflictItemResponseDto,
  ConflictsResponseDto,
  ConflictsSummaryDto,
  ConflictsSummaryRequestDto,
  DecideConflictRequestDto,
  GetConflictsRequestDto,
} from "../../../shared/zod/dto/conflicts.dto";
import { ConflictsService } from "../services/conflicts.service";

const parseSource = (value: string): IConflictSource => {
  const parsed = ConflictSourceSchema.safeParse(value);

  if (!parsed.success) {
    throw new BadRequestException(
      `Unknown conflict source: ${value}. Allowed: ${ConflictSourceSchema.options.join(", ")}`
    );
  }

  return parsed.data;
};

@ApiTags("Conflicts")
@Controller("conflicts")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
export class ConflictsController {
  constructor(private readonly conflictsService: ConflictsService) {}

  @Get()
  @ApiOperation({
    summary:
      "Count conflicts waiting for a decision and decisions not yet written to games",
  })
  @ApiOkResponse({ type: ConflictsSummaryDto })
  getSummary(@Query() dto: ConflictsSummaryRequestDto) {
    return this.conflictsService.getSummary(dto.source);
  }

  @Get("list")
  @ApiOperation({
    summary:
      "List conflicts with their state and candidate games, waiting ones first",
  })
  @ApiOkResponse({ type: ConflictsResponseDto })
  getList(@Query() dto: GetConflictsRequestDto) {
    return this.conflictsService.getList(dto);
  }

  @Get(":source/:externalId")
  @ApiOperation({
    summary:
      "Get one conflict with the source entry, candidate games and the next conflict to review",
  })
  @ApiOkResponse({ type: ConflictItemResponseDto })
  async getItem(
    @Param("source") source: string,
    @Param("externalId") externalId: string
  ) {
    return {
      item: await this.conflictsService.getItem(
        parseSource(source),
        externalId
      ),
    };
  }

  @Post(":source/:externalId/decision")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Link the entry to a candidate game, or create a new game for it; the decision is applied in the background",
  })
  @ApiOkResponse({ type: ConflictsSummaryDto })
  decide(
    @Param("source") source: string,
    @Param("externalId") externalId: string,
    @Body() dto: DecideConflictRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.conflictsService.decide(
      parseSource(source),
      externalId,
      dto,
      request.user
    );
  }

  @Post(":source/:externalId/reopen")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Put a skipped conflict back in the queue with freshly matched candidates",
  })
  @ApiOkResponse({ type: ConflictsSummaryDto })
  reopen(
    @Param("source") source: string,
    @Param("externalId") externalId: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.conflictsService.reopen(
      parseSource(source),
      externalId,
      request.user
    );
  }
}
