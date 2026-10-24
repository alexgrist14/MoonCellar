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
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type mongoose from "mongoose";
import { RolesEnum } from "@mooncellar/schemas";
import {
  AdminArticleDto,
  ArticleArchiveDto,
  ArticleDto,
  GetAdminArticlesRequestDto,
  GetAdminArticlesResponseDto,
  GetArticleBySlugRequestDto,
  GetArticleSlugsResponseDto,
  GetArticlesRequestDto,
  GetArticlesResponseDto,
  SaveArticleRequestDto,
} from "../../../shared/zod/dto/articles.dto";
import { OptionalJwtGuard } from "../../auth/optional-jwt.guard";
import type {
  IAuthorizedRequest,
  ICommunityRequest,
} from "../../comments/types/community.type";
import { Roles } from "../../roles/roles.decorator";
import { RolesGuard } from "../../roles/roles.guard";
import { ArticlesService } from "../services/articles.service";

@ApiTags("Articles")
@Controller("articles")
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: "List published posts, newest first" })
  @ApiOkResponse({ type: GetArticlesResponseDto })
  async getArticles(@Query() dto: GetArticlesRequestDto) {
    return this.articles.getArticles(dto);
  }

  @Get("archive")
  @ApiOperation({ summary: "Count published posts per year and month" })
  @ApiOkResponse({ type: ArticleArchiveDto })
  async getArchive() {
    return this.articles.getArchive();
  }

  @Get("slugs")
  @ApiOperation({ summary: "Slugs of every published post, for the sitemap" })
  @ApiOkResponse({ type: GetArticleSlugsResponseDto })
  async getSlugs() {
    return this.articles.getSlugs();
  }

  @Get("by-slug")
  @ApiOperation({ summary: "Get a published post by its slug" })
  @ApiOkResponse({ type: ArticleDto })
  async getBySlug(@Query() dto: GetArticleBySlugRequestDto) {
    return this.articles.getBySlug(dto.slug);
  }

  @Post(":id/views")
  @UseGuards(OptionalJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Count an open of a published post, once per visitor visit",
  })
  @ApiNoContentResponse()
  async registerView(
    @Param("id") id: string,
    @Req() request: ICommunityRequest
  ) {
    await this.articles.registerView(id, {
      userId: request.user ? String(request.user._id) : null,
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }

  @Get("admin")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List every post, drafts included" })
  @ApiOkResponse({ type: GetAdminArticlesResponseDto })
  async getAdminArticles(@Query() dto: GetAdminArticlesRequestDto) {
    return this.articles.getAdminArticles(dto);
  }

  @Get("admin/:id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get any post for editing" })
  @ApiOkResponse({ type: AdminArticleDto })
  async getAdminArticle(@Param("id") id: string) {
    return this.articles.getAdminArticle(id);
  }

  @Post()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a post" })
  @ApiCreatedResponse({ type: AdminArticleDto })
  async create(
    @Body() dto: SaveArticleRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.articles.create(
      dto,
      request.user._id as unknown as mongoose.Types.ObjectId
    );
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Replace a post's fields" })
  @ApiOkResponse({ type: AdminArticleDto })
  async update(@Param("id") id: string, @Body() dto: SaveArticleRequestDto) {
    return this.articles.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Delete a post" })
  async remove(@Param("id") id: string) {
    return this.articles.remove(id);
  }
}
