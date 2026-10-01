import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type mongoose from "mongoose";
import { RolesEnum } from "@mooncellar/schemas";
import {
  GenerateImageRequestDto,
  GenerateImageResponseDto,
  GeneratedImageDto,
  SaveGeneratedImageRequestDto,
  SuggestImageElementsRequestDto,
  SuggestImageElementsResponseDto,
} from "../../shared/zod/dto/generated-images.dto";
import type { IAuthorizedRequest } from "../comments/types/community.type";
import { Roles } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { ImagesService } from "./images.service";

@ApiTags("Generated images")
@Controller("admin/images")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(RolesEnum.ADMIN)
@ApiCookieAuth()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Get()
  @ApiOperation({ summary: "List the images saved to the Space, newest first" })
  @ApiOkResponse({ type: [GeneratedImageDto] })
  async list() {
    return this.images.list();
  }

  @Post("generate")
  @ApiOperation({
    summary: "Generate an image with OpenAI or Recraft, nothing is stored",
  })
  @ApiCreatedResponse({ type: GenerateImageResponseDto })
  async generate(@Body() dto: GenerateImageRequestDto) {
    return this.images.generate(dto);
  }

  @Post("elements")
  @ApiOperation({
    summary:
      "Ask OpenAI which separate elements an image is built from, with a prompt for each",
  })
  @ApiCreatedResponse({ type: SuggestImageElementsResponseDto })
  async suggestElements(@Body() dto: SuggestImageElementsRequestDto) {
    return this.images.suggestElements(dto);
  }

  @Post()
  @ApiOperation({
    summary: "Upload a generated image to the Space and save it",
  })
  @ApiCreatedResponse({ type: GeneratedImageDto })
  async save(
    @Body() dto: SaveGeneratedImageRequestDto,
    @Req() request: IAuthorizedRequest
  ) {
    return this.images.save(
      dto,
      request.user._id as unknown as mongoose.Types.ObjectId
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a saved image and its file in the Space" })
  async remove(@Param("id") id: string) {
    return this.images.remove(id);
  }
}
