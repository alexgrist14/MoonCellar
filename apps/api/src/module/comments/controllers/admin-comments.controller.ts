import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import {
  AdminCommentsResponseDto,
  GetAdminCommentsRequestDto,
} from "../../../shared/zod/dto/comment-reports.dto";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import { CommentReportsService } from "../services/comment-reports.service";

@ApiTags("Comment reports")
@Controller("admin/comments")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
@ApiCookieAuth()
export class AdminCommentsController {
  constructor(private readonly reports: CommentReportsService) {}

  @Get()
  @ApiOperation({ summary: "List every comment, newest first" })
  @ApiCreatedResponse({ type: AdminCommentsResponseDto })
  async getComments(@Query() dto: GetAdminCommentsRequestDto) {
    return this.reports.getComments(dto);
  }
}
