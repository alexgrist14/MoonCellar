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
  CreateProjectTokenRequestDto,
  ProjectConnectCodeDto,
  ProjectConnectRequestDto,
  ProjectDto,
  ProjectTokenDto,
  ProjectTokenExchangeDto,
  ProjectTokenExchangeRequestDto,
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
  @ApiOperation({
    summary: "Every project with its blocks, uploads and tokens",
  })
  @ApiOkResponse({ type: [ProjectDto] })
  list() {
    return this.projectsService.list();
  }

  @Post()
  @ApiOperation({ summary: "Add a project" })
  @ApiOkResponse({ type: ProjectDto })
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateProjectRequestDto) {
    return this.projectsService.create(dto);
  }

  @Get(":slug")
  @ApiOperation({ summary: "One project with its blocks, uploads and tokens" })
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

  @Post(":slug/tokens")
  @ApiOperation({ summary: "Add an upload token; the answer carries it once" })
  @ApiOkResponse({ type: ProjectTokenDto })
  @HttpCode(HttpStatus.OK)
  addToken(
    @Param("slug") slug: string,
    @Body() dto: CreateProjectTokenRequestDto
  ) {
    return this.projectsService.addToken(slug, dto.name);
  }

  @Delete(":slug/tokens/:id")
  @ApiOperation({ summary: "Revoke one upload token" })
  @ApiOkResponse({ type: ProjectDto })
  revokeToken(@Param("slug") slug: string, @Param("id") id: string) {
    return this.projectsService.revokeToken(slug, id);
  }

  @Post(":slug/connect")
  @ApiOperation({
    summary: "A one-time code that a connect command exchanges for its token",
  })
  @ApiOkResponse({ type: ProjectConnectCodeDto })
  @HttpCode(HttpStatus.OK)
  connect(@Param("slug") slug: string, @Body() dto: ProjectConnectRequestDto) {
    return this.projectsService.createConnectCode(slug, dto.name);
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

  @Post(":slug/tokens/exchange")
  @ApiOperation({
    summary: "Exchange a connection code from the hub for an upload token",
  })
  @ApiOkResponse({ type: ProjectTokenExchangeDto })
  @HttpCode(HttpStatus.OK)
  exchange(
    @Param("slug") slug: string,
    @Body() dto: ProjectTokenExchangeRequestDto
  ) {
    return this.projectsService.exchangeCode(slug, dto.code);
  }

  @Put(":slug/data/:block")
  @ApiOperation({
    summary:
      "Upload a block with one of the project's tokens (Authorization: Bearer <token>)",
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
