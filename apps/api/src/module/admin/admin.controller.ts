import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { type IRole, RolesEnum } from "src/shared/zod/schemas/role.schema";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Admin user management")
@Controller("admin")
@UseGuards(RolesGuard)
@Roles(RolesEnum.ADMIN)
@UseGuards(AuthGuard("jwt"))
@ApiCookieAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  async getAll() {
    return this.adminService.getAllUsers();
  }

  @Get("users/:userId")
  async getUserById(@Param("userId") userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Get("games/:gameId")
  async getGameById(@Param("gameId") gameId: string) {
    return this.adminService.getGameById(gameId);
  }

  @Patch("users/:userId/role/:role")
  async addUserRole(
    @Param("userId") userId: string,
    @Param("role") role: IRole
  ) {
    return this.adminService.addUserRole(userId, role);
  }

  @Delete("users/:userId/role/:role")
  async removeUserRole(
    @Param("userId") userId: string,
    @Param("role") role: IRole
  ) {
    return this.adminService.removeUserRole(userId, role);
  }

  @Delete("users/:userId")
  async deleteUser(@Param("userId") userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Post("logs/merge-duplicates")
  async mergeDuplicateGameLogs() {
    return this.adminService.mergeDuplicateGameLogs();
  }
}
