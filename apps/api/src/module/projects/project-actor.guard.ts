import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { RolesEnum } from "@mooncellar/schemas";
import type { User } from "../user/schemas/user.schema";
import type { IPlanActor } from "./project-plans.service";
import { ProjectsService, readBearerToken } from "./projects.service";

export type IProjectActorRequest = Request & {
  user?: User;
  projectActor?: IPlanActor;
};

const JwtGuard = AuthGuard("jwt");

@Injectable()
export class ProjectActorGuard implements CanActivate {
  private readonly jwt = new JwtGuard();

  constructor(private readonly projects: ProjectsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<IProjectActorRequest>();
    const authorization = request.headers.authorization;
    if (readBearerToken(authorization)) {
      const { token } = await this.projects.authorizeToken(
        String(request.params.slug),
        authorization
      );
      request.projectActor = {
        kind: "token",
        name: token.name,
        tokenId: token.id,
      };
      return true;
    }
    await this.jwt.canActivate(context);
    const user = request.user;
    if (!user?.roles?.includes(RolesEnum.ADMIN)) {
      throw new ForbiddenException("This action needs the admin role");
    }
    request.projectActor = { kind: "admin", name: user.userName };
    return true;
  }
}
