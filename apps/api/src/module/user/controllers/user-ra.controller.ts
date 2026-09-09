import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserRAService } from "../services/user-ra.service";

@ApiTags("User RA")
@Controller("user")
export class UserRAController {
  constructor(private readonly userRAService: UserRAService) {}

  @Get("/ra/:raUsername")
  @ApiOperation({ summary: "Get RA user achievements" })
  @ApiResponse({
    status: 200,
    description: "Success",
  })
  async getAchievements(@Param("raUsername") raUsername: string) {
    return this.userRAService.getUserAchievements(raUsername);
  }

  // @Get('/ra/awards/:raUsername')
  // @ApiOperation({summary: 'Get RA user awards'})
  // @ApiResponse({
  //     status: 200,
  //     description: 'Success',
  // })
  // async getAwards(@Param('raUsername') raUsername: string){
  //     return this.userRAService.getUserAwards(raUsername);
  // }
  @Patch("/ra/:userId/:raUserName")
  @ApiOperation({ summary: "Set RA user info" })
  @ApiResponse({
    status: 201,
    description: "Success",
  })
  async setUserInfo(
    @Param("userId") userId: string,
    @Param("raUserName") raUserName: string
  ) {
    return this.userRAService.setUserRAInfo(userId, raUserName);
  }
}
