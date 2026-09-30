import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RolesEnum } from "@mooncellar/schemas";
import {
  SaveSiteSessionDto,
  SiteSessionDto,
  TestSiteSessionResponseDto,
} from "../../shared/zod/dto/site-sessions.dto";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { SitesService } from "./sites.service";

@ApiTags("Sites")
@Controller("admin/sites")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
@ApiCookieAuth()
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get()
  @ApiOperation({
    summary: "Sites the parsers visit with stored cookies or headers",
  })
  @ApiOkResponse({ type: [SiteSessionDto] })
  async getSessions() {
    return this.sites.getSessions();
  }

  @Post()
  @ApiOperation({ summary: "Add a site" })
  @ApiOkResponse({ type: SiteSessionDto })
  @HttpCode(HttpStatus.OK)
  async createSession(@Body() dto: SaveSiteSessionDto) {
    return this.sites.saveSession(undefined, dto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a site; an empty cookie keeps the stored one",
  })
  @ApiOkResponse({ type: SiteSessionDto })
  async updateSession(
    @Param("id") id: string,
    @Body() dto: SaveSiteSessionDto
  ) {
    return this.sites.saveSession(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a site and its cookie" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@Param("id") id: string) {
    return this.sites.deleteSession(id);
  }

  @Post(":id/test")
  @ApiOperation({ summary: "Open the site's home page with its settings" })
  @ApiOkResponse({ type: TestSiteSessionResponseDto })
  @HttpCode(HttpStatus.OK)
  async testSession(@Param("id") id: string) {
    return this.sites.testSession(id);
  }
}
