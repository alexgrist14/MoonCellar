import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UnsupportedMediaTypeException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { findGame } from "../../games/games";
import {
  GameStorageFileQueryDto,
  GameStorageListDto,
  GameStorageParamsDto,
  GameStorageWriteQueryDto,
  GameStorageWriteResultDto,
} from "../../shared/zod/dto/game.dto";
import { GameTokenGuard, type IGameRequest } from "../account/game-token.guard";
import { StorageService } from "./storage.service";

const fileBody = (request: IGameRequest, body: unknown) => {
  if (Buffer.isBuffer(body)) return body;
  const type = request.headers["content-type"] ?? "";
  if (
    type.startsWith("application/octet-stream") &&
    Number(request.headers["content-length"] ?? 0) === 0
  ) {
    return Buffer.alloc(0);
  }
  throw new UnsupportedMediaTypeException(
    "Send the file as application/octet-stream"
  );
};

@ApiTags("Storage")
@ApiBearerAuth()
@UseGuards(GameTokenGuard)
@Controller("games/:game/storage/:bucket")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get()
  @ApiOperation({
    summary:
      "The player's files in a storage bucket of the game, without their data",
  })
  @ApiOkResponse({ type: GameStorageListDto })
  list(@Param() params: GameStorageParamsDto, @Req() request: IGameRequest) {
    return this.storage.list(
      findGame(params.game),
      params.bucket,
      request.account
    );
  }

  @Get("file")
  @ApiOperation({ summary: "A file of the player's storage, as raw bytes" })
  @ApiProduces("application/octet-stream")
  async read(
    @Param() params: GameStorageParamsDto,
    @Query() query: GameStorageFileQueryDto,
    @Req() request: IGameRequest,
    @Res({ passthrough: true }) response: Response
  ) {
    const { data, file } = await this.storage.read(
      findGame(params.game),
      params.bucket,
      request.account,
      query.path
    );
    response.setHeader("X-Content-SHA256", file.sha256);
    response.setHeader("Last-Modified", new Date(file.updatedAt).toUTCString());
    return new StreamableFile(data, {
      type: "application/octet-stream",
      length: data.length,
    });
  }

  @Put("file")
  @ApiOperation({
    summary:
      "Write a file of the player's storage from raw bytes; with `revision`, only while the bucket is at that revision",
  })
  @ApiConsumes("application/octet-stream")
  @ApiBody({ schema: { type: "string", format: "binary" } })
  @ApiOkResponse({ type: GameStorageWriteResultDto })
  write(
    @Param() params: GameStorageParamsDto,
    @Query() query: GameStorageWriteQueryDto,
    @Body() body: unknown,
    @Req() request: IGameRequest
  ) {
    return this.storage.write(
      findGame(params.game),
      params.bucket,
      request.account,
      query.path,
      fileBody(request, body),
      query.revision
    );
  }

  @Delete("file")
  @ApiOperation({ summary: "Delete a file of the player's storage" })
  @ApiOkResponse({ type: GameStorageWriteResultDto })
  remove(
    @Param() params: GameStorageParamsDto,
    @Query() query: GameStorageWriteQueryDto,
    @Req() request: IGameRequest
  ) {
    return this.storage.remove(
      findGame(params.game),
      params.bucket,
      request.account,
      query.path,
      query.revision
    );
  }
}
