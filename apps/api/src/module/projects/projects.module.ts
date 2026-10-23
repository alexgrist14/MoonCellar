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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectData.name, schema: ProjectDataSchema },
      { name: ProjectConnectCode.name, schema: ProjectConnectCodeSchema },
    ]),
  ],
  controllers: [ProjectsController, ProjectUploadsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
