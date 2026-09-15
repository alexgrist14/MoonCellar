import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
import { RolesEnum, SOCKET_ID_HEADER } from "@mooncellar/schemas";
import {
  CommentResponseDto,
  CommentsResponseDto,
  CreateCommentRequestDto,
  GetCommentsRequestDto,
  GetRepliesRequestDto,
  ReportResponseDto,
  UpdateCommentRequestDto,
  UpdateCommentStatusRequestDto,
  VoteResponseDto,
} from "../../../shared/zod/dto/comments.dto";
import { OptionalJwtGuard } from "../../auth/optional-jwt.guard";
import { UserIdGuard } from "../../auth/user.guard";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import { CommentsService } from "../services/comments.service";
import type {
  IAuthorizedRequest,
  ICommunityRequest,
} from "../types/community.type";

const getSocketId = (request: IAuthorizedRequest) => {
  const socketId = request.headers[SOCKET_ID_HEADER];

  return typeof socketId === "string" ? socketId : undefined;
};

@ApiTags("Comments")
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get("games/:gameId/comments")
  @ApiOperation({ summary: "Get top-level comments of a game" })
  @ApiCreatedResponse({ type: CommentsResponseDto })
  @UseGuards(OptionalJwtGuard)
  async getComments(
    @Param("gameId") gameId: string,
    @Query() dto: GetCommentsRequestDto,
    @Req() request: ICommunityRequest
  ) {
    return this.comments.getComments(gameId, dto, request.user);
  }

  @Get("comments/:id/replies")
  @ApiOperation({ summary: "Get replies to a comment" })
  @ApiCreatedResponse({ type: CommentsResponseDto })
  @UseGuards(OptionalJwtGuard)
  async getReplies(
    @Param("id") id: string,
    @Query() dto: GetRepliesRequestDto,
    @Req() request: ICommunityRequest
  ) {
    return this.comments.getReplies(id, dto, request.user);
  }

  @Post("comments")
  @ApiOperation({ summary: "Post a comment or a reply" })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async createComment(
    @Body() dto: CreateCommentRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.createComment(
      dto,
      request.user,
      getSocketId(request)
    );
  }

  @Patch("comments/:id")
  @ApiOperation({ summary: "Edit own comment" })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @Param("id") id: string,
    @Body() dto: UpdateCommentRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.updateComment(
      id,
      dto,
      request.user,
      getSocketId(request)
    );
  }

  @Delete("comments/:id")
  @ApiOperation({ summary: "Delete own comment, or any comment as an admin" })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.deleteComment(
      id,
      request.user,
      getSocketId(request)
    );
  }

  @Put("comments/:id/like")
  @ApiOperation({ summary: "Like a comment" })
  @ApiCreatedResponse({ type: VoteResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async likeComment(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.setLike(
      id,
      request.user,
      true,
      getSocketId(request)
    );
  }

  @Delete("comments/:id/like")
  @ApiOperation({ summary: "Remove a like from a comment" })
  @ApiCreatedResponse({ type: VoteResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async unlikeComment(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.setLike(
      id,
      request.user,
      false,
      getSocketId(request)
    );
  }

  @Post("comments/:id/report")
  @ApiOperation({ summary: "Report a comment to moderators" })
  @ApiCreatedResponse({ type: ReportResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @HttpCode(HttpStatus.OK)
  async reportComment(
    @Param("id") id: string,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.reportComment(id, request.user);
  }

  @Patch("comments/:id/status")
  @ApiOperation({ summary: "Hide or restore a comment" })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateCommentStatus(
    @Param("id") id: string,
    @Body() dto: UpdateCommentStatusRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.comments.updateStatus(
      id,
      dto.status,
      request.user,
      getSocketId(request)
    );
  }
}
