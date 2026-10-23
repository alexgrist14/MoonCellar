import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import {
  CreateProjectRequestDto,
  ProjectDto,
  ProjectTokenDto,
  ProjectUploadDto,
  UpdateProjectRequestDto,
} from "../../shared/zod/dto/projects.dto";
import { ProjectsService } from "./projects.service";

@ApiTags("Projects")
@Controller("projects")
@ApiCookieAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: "Every project with its blocks and last uploads" })
  @ApiOkResponse({ type: [ProjectDto] })
  list() {
    return this.projectsService.list();
  }

  @Post()
  @ApiOperation({
    summary: "Add a project; the answer carries its upload token once",
  })
  @ApiOkResponse({ type: ProjectTokenDto })
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateProjectRequestDto) {
    return this.projectsService.create(dto);
  }

  @Get(":slug")
  @ApiOperation({ summary: "One project with its blocks and last uploads" })
  @ApiOkResponse({ type: ProjectDto })
  get(@Param("slug") slug: string) {
    return this.projectsService.get(slug);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Rename a project or change its blocks" })
  @ApiOkResponse({ type: ProjectDto })
  update(@Param("slug") slug: string, @Body() dto: UpdateProjectRequestDto) {
    return this.projectsService.update(slug, dto);
  }

  @Delete(":slug")
  @ApiOperation({ summary: "Delete a project and everything it uploaded" })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("slug") slug: string) {
    return this.projectsService.remove(slug);
  }

  @Post(":slug/token")
  @ApiOperation({
    summary: "Issue a new upload token; the old one stops working",
  })
  @ApiOkResponse({ type: ProjectTokenDto })
  @HttpCode(HttpStatus.OK)
  rotateToken(@Param("slug") slug: string) {
    return this.projectsService.rotateToken(slug);
  }

  @Get(":slug/data/:block")
  @ApiOperation({ summary: "The block as the project last uploaded it" })
  @Header("Content-Type", "application/json; charset=utf-8")
  @Header("Cache-Control", "no-store")
  getData(@Param("slug") slug: string, @Param("block") block: string) {
    return this.projectsService.getData(slug, block);
  }
}

@ApiTags("Projects")
@Controller("projects")
export class ProjectUploadsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Put(":slug/data/:block")
  @ApiOperation({
    summary:
      "Upload a block with the project's token (Authorization: Bearer <token>)",
  })
  @ApiBearerAuth()
  @ApiBody({
    description:
      "PlanBlockSchema or DecompBlockSchema from @mooncellar/schemas",
  })
  @ApiOkResponse({ type: ProjectUploadDto })
  putData(
    @Param("slug") slug: string,
    @Param("block") block: string,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown
  ) {
    return this.projectsService.putData(slug, block, authorization, body);
  }
}
