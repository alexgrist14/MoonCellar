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
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import {
  ConflictAiVerdictSchema,
  ConflictSourceSchema,
  type IConflictSource,
  RolesEnum,
} from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import type { IAuthorizedRequest } from "../../comments/types/community.type";
import {
  AddConflictCandidateRequestDto,
  ConflictItemResponseDto,
  ConflictsAiStatusDto,
  ConflictAiMatchesResponseDto,
  UndoAiMatchesRequestDto,
  ConflictsResponseDto,
  ConflictsSummaryDto,
  GameConflictsResponseDto,
  ConflictsSummaryRequestDto,
  DecideConflictRequestDto,
  GetConflictsRequestDto,
} from "../../../shared/zod/dto/conflicts.dto";
import { ConflictsAiService } from "../services/conflicts-ai.service";
import { ConflictsService } from "../services/conflicts.service";

const parseConfidences = (value?: string) => {
  if (value === undefined) return undefined;

  const confidences = value.split(",").map((part) => part.trim());
  const allowed = ConflictAiVerdictSchema.shape.confidence.options;
  const unknown = confidences.filter(
    (part) => !(allowed as readonly string[]).includes(part)
  );

  if (!confidences.length || unknown.length) {
    throw new BadRequestException(
      `Unknown confidence: ${unknown.join(", ") || "none given"}. Allowed: ${allowed.join(", ")}`
    );
  }

  return confidences as (typeof allowed)[number][];
};

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
  constructor(
    private readonly conflictsService: ConflictsService,
    private readonly conflictsAi: ConflictsAiService
  ) {}

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

  @Get("by-game/:gameId")
  @ApiOperation({
    summary:
      "List the conflicts still waiting for a decision that involve a game",
  })
  @ApiOkResponse({ type: GameConflictsResponseDto })
  getForGame(@Param("gameId") gameId: string) {
    return this.conflictsService.getForGame(gameId);
  }

  @Get("ai/status")
  @ApiOperation({
    summary: "Progress of the running AI job, or the result of the last one",
  })
  @ApiOkResponse({ type: ConflictsAiStatusDto })
  getAiStatus() {
    return this.conflictsAi.getStatus();
  }

  @Get("ai/matches")
  @ApiOperation({
    summary:
      "Matches the AI made that can be undone, newest first, for a source or every source that can undo",
  })
  @ApiOkResponse({ type: ConflictAiMatchesResponseDto })
  getAiMatches(@Query("source") source?: string) {
    return this.conflictsAi.getMatches(
      source ? parseSource(source) : undefined
    );
  }

  @Post(["ai", ":source/ai"])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Ask OpenAI in the background to judge undecided conflicts of a source, or of each source without one; with apply, confident verdicts are decided",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description:
      "How many conflicts without a verdict to judge per source (default 200); 0 with apply only applies stored verdicts",
  })
  @ApiQuery({
    name: "apply",
    required: false,
    description:
      "true decides every confident match, including verdicts stored by earlier runs",
  })
  @ApiQuery({
    name: "confidences",
    required: false,
    description:
      "Comma-separated verdict confidences to apply (high, medium, low); high when omitted",
  })
  reviewWithAi(
    @Req() request: IAuthorizedRequest,
    @Param("source") source?: string,
    @Query("limit") limit?: string,
    @Query("apply") apply?: string,
    @Query("confidences") confidences?: string
  ) {
    return this.conflictsAi.start(
      source === undefined ? undefined : parseSource(source),
      {
        limit: limit === undefined ? 200 : Math.max(0, Number(limit) || 0),
        apply: apply === "true",
        confidences: parseConfidences(confidences),
      },
      request.user
    );
  }

  @Post(["ai/create", ":source/ai/create"])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Add a new game in the background for every waiting conflict whose AI verdict says, with high confidence, that no candidate is the entry; only sources that allow it",
  })
  @ApiQuery({
    name: "confidences",
    required: false,
    description:
      "Comma-separated no-match verdict confidences to add games for (high, medium, low); high when omitted",
  })
  createWithAi(
    @Req() request: IAuthorizedRequest,
    @Param("source") source?: string,
    @Query("confidences") confidences?: string
  ) {
    return this.conflictsAi.startCreate(
      source === undefined ? undefined : parseSource(source),
      request.user,
      parseConfidences(confidences)
    );
  }

  @Post(["ai/undo", ":source/ai/undo"])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Undo in the background every match the AI made for a source, or for every source that can undo, and put those conflicts back in the queue",
  })
  undoAiDecisions(
    @Req() request: IAuthorizedRequest,
    @Body() dto: UndoAiMatchesRequestDto,
    @Param("source") source?: string
  ) {
    return this.conflictsAi.startUndo(
      source === undefined ? undefined : parseSource(source),
      request.user,
      dto?.items
    );
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

  @Post(":source/:externalId/candidates")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      "Add a catalogue game, found by hand or named by id or slug, to the candidates of a waiting conflict",
  })
  addCandidate(
    @Param("source") source: string,
    @Param("externalId") externalId: string,
    @Body() dto: AddConflictCandidateRequestDto
  ) {
    return this.conflictsService.addCandidate(
      parseSource(source),
      externalId,
      dto.game
    );
  }

  @Post(":source/:externalId/undo")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Take back a match: unlink the games it wrote and put the conflict back in the queue",
  })
  @ApiOkResponse({ type: ConflictsSummaryDto })
  undo(
    @Param("source") source: string,
    @Param("externalId") externalId: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.conflictsService.undo(
      parseSource(source),
      externalId,
      request.user
    );
  }
}
