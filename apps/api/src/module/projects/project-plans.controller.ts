import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { PlanTaskActionSchema } from "@mooncellar/schemas";
import {
  CreatePlanSectionRequestDto,
  CreatePlanTaskRequestDto,
  PlanBlockDto,
  PlanEventDto,
  PlanTaskActionRequestDto,
  UpdatePlanSectionRequestDto,
  UpdatePlanTaskRequestDto,
} from "../../shared/zod/dto/projects.dto";
import {
  ProjectActorGuard,
  type IProjectActorRequest,
} from "./project-actor.guard";
import { ProjectPlansService, type IPlanActor } from "./project-plans.service";

const actorOf = (request: IProjectActorRequest): IPlanActor =>
  request.projectActor as IPlanActor;

@ApiTags("Project plans")
@Controller("projects/:slug/plan")
@ApiCookieAuth()
@ApiBearerAuth()
@UseGuards(ProjectActorGuard)
export class ProjectPlansController {
  constructor(private readonly plans: ProjectPlansService) {}

  @Get()
  @ApiOperation({
    summary: "The project's plan: sections and tasks with their state",
  })
  @ApiOkResponse({ type: PlanBlockDto })
  get(@Param("slug") slug: string) {
    return this.plans.getPlan(slug);
  }

  @Put()
  @ApiOperation({
    summary: "Import a whole plan once, while the hub's plan is empty",
  })
  @ApiBody({ description: "PlanBlockSchema from @mooncellar/schemas" })
  @ApiOkResponse({ type: PlanBlockDto })
  import(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.importPlan(slug, body, actorOf(request));
  }

  @Get("events")
  @ApiOperation({ summary: "Recent changes of the plan, or of one task" })
  @ApiOkResponse({ type: [PlanEventDto] })
  events(@Param("slug") slug: string, @Query("task") task?: string) {
    return this.plans.listEvents(slug, task || undefined);
  }

  @Post("sections")
  @ApiOperation({ summary: "Add a section" })
  @ApiOkResponse({ type: PlanBlockDto })
  @HttpCode(HttpStatus.OK)
  createSection(
    @Param("slug") slug: string,
    @Body() dto: CreatePlanSectionRequestDto,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.createSection(slug, dto, actorOf(request));
  }

  @Patch("sections/:sectionId")
  @ApiOperation({ summary: "Rename a section" })
  @ApiOkResponse({ type: PlanBlockDto })
  updateSection(
    @Param("slug") slug: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: UpdatePlanSectionRequestDto,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.updateSection(slug, sectionId, dto, actorOf(request));
  }

  @Delete("sections/:sectionId")
  @ApiOperation({
    summary: "Delete an empty section (admins on the site only)",
  })
  @ApiOkResponse({ type: PlanBlockDto })
  deleteSection(
    @Param("slug") slug: string,
    @Param("sectionId") sectionId: string,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.deleteSection(slug, sectionId, this.adminOnly(request));
  }

  @Post("tasks")
  @ApiOperation({
    summary: "Add a task; its id is the section's letter and the next number",
  })
  @ApiOkResponse({ type: PlanBlockDto })
  @HttpCode(HttpStatus.OK)
  createTask(
    @Param("slug") slug: string,
    @Body() dto: CreatePlanTaskRequestDto,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.createTask(slug, dto, actorOf(request));
  }

  @Patch("tasks/:taskId")
  @ApiOperation({
    summary: "Change a task's text, section, dependencies or size",
  })
  @ApiOkResponse({ type: PlanBlockDto })
  updateTask(
    @Param("slug") slug: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdatePlanTaskRequestDto,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.updateTask(slug, taskId, dto, actorOf(request));
  }

  @Delete("tasks/:taskId")
  @ApiOperation({ summary: "Delete a task (admins on the site only)" })
  @ApiOkResponse({ type: PlanBlockDto })
  deleteTask(
    @Param("slug") slug: string,
    @Param("taskId") taskId: string,
    @Req() request: IProjectActorRequest
  ) {
    return this.plans.deleteTask(slug, taskId, this.adminOnly(request));
  }

  @Post("tasks/:taskId/:action")
  @ApiOperation({
    summary:
      "Take, release, finish or reopen a task (take, release, done, reopen)",
  })
  @ApiOkResponse({ type: PlanBlockDto })
  @HttpCode(HttpStatus.OK)
  act(
    @Param("slug") slug: string,
    @Param("taskId") taskId: string,
    @Param("action") action: string,
    @Body() dto: PlanTaskActionRequestDto,
    @Req() request: IProjectActorRequest
  ) {
    const parsed = PlanTaskActionSchema.safeParse(action);
    if (!parsed.success) {
      throw new BadRequestException(
        `Unknown action "${action}". Use take, release, done or reopen`
      );
    }
    return this.plans.act(slug, taskId, parsed.data, dto, actorOf(request));
  }

  private adminOnly(request: IProjectActorRequest) {
    const actor = actorOf(request);
    if (actor.kind !== "admin") {
      throw new ForbiddenException(
        "Only an admin on the hub can delete from the plan"
      );
    }
    return actor;
  }
}
