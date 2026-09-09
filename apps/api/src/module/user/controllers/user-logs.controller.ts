import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { UserLogsService } from "../services/user-logs.service";
import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserIdGuard } from "src/module/auth/user.guard";
import {
  GetUserLogsDto,
  RemoveUserLogDto,
} from "src/shared/zod/dto/user-logs.dto";

@ApiTags("User Logs")
@Controller("user")
export class UserLogsController {
  constructor(private readonly userLogsService: UserLogsService) {}

  @Get("/logs/:userId")
  @ApiOperation({ summary: "Get user logs" })
  @ApiQuery({ name: "take", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  getLogs(@Param("userId") userId: string, @Query() query: GetUserLogsDto) {
    return this.userLogsService.getUserLogs(userId, query);
  }

  @Delete("/logs")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), UserIdGuard)
  @ApiOperation({ summary: "Remove user log" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  removeLog(@Query() dto: RemoveUserLogDto) {
    return this.userLogsService.removeUserLog(dto);
  }
}
