import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { ProjectData, ProjectDataSchema } from "./schemas/project-data.schema";
import {
  ProjectConnectCode,
  ProjectConnectCodeSchema,
} from "./schemas/project-connect-code.schema";
import {
  ProjectUploadsController,
  ProjectsController,
} from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectPlansService } from "./project-plans.service";
import { ProjectPlansController } from "./project-plans.controller";
import { ProjectActorGuard } from "./project-actor.guard";
import {
  ProjectPlan,
  ProjectPlanEvent,
  ProjectPlanEventSchema,
  ProjectPlanSchema,
} from "./schemas/project-plan.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectData.name, schema: ProjectDataSchema },
      { name: ProjectConnectCode.name, schema: ProjectConnectCodeSchema },
      { name: ProjectPlan.name, schema: ProjectPlanSchema },
      { name: ProjectPlanEvent.name, schema: ProjectPlanEventSchema },
    ]),
  ],
  controllers: [
    ProjectPlansController,
    ProjectsController,
    ProjectUploadsController,
  ],
  providers: [ProjectsService, ProjectPlansService, ProjectActorGuard],
})
export class ProjectsModule {}
