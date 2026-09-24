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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import {
  CreateContentRequestSchema,
  RolesEnum,
  type ICreateContentRequestParsed,
} from "@mooncellar/schemas";
import { UserIdGuard } from "../../auth/user.guard";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import type { IAuthorizedRequest } from "../../comments/types/community.type";
import { ContentRequestsService } from "../services/content-requests.service";
import {
  ContentRequestDetailDto,
  ContentRequestResponseDto,
  ContentRequestsResponseDto,
  DecideContentRequestDto,
  DecideContentRequestResponseDto,
  GetContentRequestsDto,
  GetContentRequestsResponseDto,
} from "../../../shared/zod/dto/content-requests.dto";

const getUserId = (request: IAuthorizedRequest) =>
  String((request.user as unknown as { _id: unknown })._id);

@ApiTags("Content requests")
@Controller("requests")
export class ContentRequestsController {
  constructor(private readonly requests: ContentRequestsService) {}

  @Post()
  @ApiOperation({ summary: "Suggest a new game or character, or a correction" })
  @ApiOkResponse({ type: ContentRequestResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  create(
    @Body(new ZodValidationPipe(CreateContentRequestSchema))
    dto: ICreateContentRequestParsed,
    @Req() request: IAuthorizedRequest
  ) {
    return this.requests.create(getUserId(request), dto);
  }

  @Get("mine")
  @ApiOperation({ summary: "The signed-in user's requests, newest first" })
  @ApiOkResponse({ type: ContentRequestsResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  listMine(@Req() request: IAuthorizedRequest) {
    return this.requests.listMine(getUserId(request));
  }

  @Delete(":id")
  @ApiOperation({ summary: "Withdraw an own pending request" })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  withdraw(@Param("id") id: string, @Req() request: IAuthorizedRequest) {
    return this.requests.withdraw(getUserId(request), id);
  }

  @Get()
  @ApiOperation({ summary: "Moderation queue" })
  @ApiOkResponse({ type: GetContentRequestsResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  list(@Query() query: GetContentRequestsDto) {
    return this.requests.list(query as never);
  }

  @Get(":id")
  @ApiOperation({ summary: "One request with the current values of its target" })
  @ApiOkResponse({ type: ContentRequestDetailDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  get(@Param("id") id: string) {
    return this.requests.get(id);
  }

  @Post(":id/decision")
  @ApiOperation({
    summary:
      "Approve (writes the entry and uploads the accepted images) or reject a request",
  })
  @ApiOkResponse({ type: DecideContentRequestResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  decide(
    @Param("id") id: string,
    @Body() dto: DecideContentRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.requests.decide(getUserId(request), id, dto);
  }
}
