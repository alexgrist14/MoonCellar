import { createZodDto } from "nestjs-zod";
import {
  AdminArticleSchema,
  ArticleArchiveSchema,
  ArticleSchema,
  GetAdminArticlesRequestSchema,
  GetAdminArticlesResponseSchema,
  GetArticleBySlugRequestSchema,
  GetArticleSlugsResponseSchema,
  GetArticlesRequestSchema,
  GetArticlesResponseSchema,
  SaveArticleRequestSchema,
} from "@mooncellar/schemas";

export class ArticleDto extends createZodDto(ArticleSchema) {}

export class AdminArticleDto extends createZodDto(AdminArticleSchema) {}

export class GetArticlesRequestDto extends createZodDto(
  GetArticlesRequestSchema
) {}

export class GetArticlesResponseDto extends createZodDto(
  GetArticlesResponseSchema
) {}

export class ArticleArchiveDto extends createZodDto(ArticleArchiveSchema) {}

export class GetArticleBySlugRequestDto extends createZodDto(
  GetArticleBySlugRequestSchema
) {}

export class GetArticleSlugsResponseDto extends createZodDto(
  GetArticleSlugsResponseSchema
) {}

export class GetAdminArticlesRequestDto extends createZodDto(
  GetAdminArticlesRequestSchema
) {}

export class GetAdminArticlesResponseDto extends createZodDto(
  GetAdminArticlesResponseSchema
) {}

export class SaveArticleRequestDto extends createZodDto(
  SaveArticleRequestSchema
) {}
