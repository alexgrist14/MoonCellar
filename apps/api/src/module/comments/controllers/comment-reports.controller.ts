import {
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
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import {
  CommentReportsResponseDto,
  GetCommentReportsRequestDto,
  ResolveCommentReportsRequestDto,
  ResolveCommentReportsResponseDto,
} from "../../../shared/zod/dto/comment-reports.dto";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import { CommentReportsService } from "../services/comment-reports.service";
import type { IAuthorizedRequest } from "../types/community.type";

@ApiTags("Comment reports")
@Controller("admin/comment-reports")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
@ApiCookieAuth()
export class CommentReportsController {
  constructor(private readonly reports: CommentReportsService) {}

  @Get()
  @ApiOperation({ summary: "List reported comments, grouped by comment" })
  @ApiCreatedResponse({ type: CommentReportsResponseDto })
  async getReports(@Query() dto: GetCommentReportsRequestDto) {
    return this.reports.getReports(dto);
  }

  @Post(":commentId/resolve")
  @ApiOperation({
    summary: "Hide, delete or keep a reported comment and close its reports",
  })
  @ApiCreatedResponse({ type: ResolveCommentReportsResponseDto })
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Param("commentId") commentId: string,
    @Body() dto: ResolveCommentReportsRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.reports.resolve(commentId, dto.action, request.user);
  }
}
