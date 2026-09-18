import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { ImageOrphansService } from "../services/image-orphans.service";
import { S3_FOLDERS, type S3Folder } from "../../../shared/s3";

const GAME_IMAGE_FOLDERS: S3Folder[] = [
  S3_FOLDERS.covers,
  S3_FOLDERS.screenshots,
  S3_FOLDERS.artworks,
];

const parseNumber = (name: string, value?: string) => {
  if (value === undefined) return undefined;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`${name} must be a number`);
  }

  return parsed;
};

const parseFolders = (value?: string): S3Folder[] | undefined => {
  if (!value) return undefined;

  const folders = value
    .split(",")
    .map((folder) => folder.trim())
    .filter(Boolean);

  const unknown = folders.filter(
    (folder) => !GAME_IMAGE_FOLDERS.includes(folder as S3Folder)
  );

  if (unknown.length) {
    throw new BadRequestException(
      `Unknown folders: ${unknown.join(", ")}. Allowed: ${GAME_IMAGE_FOLDERS.join(", ")}`
    );
  }

  return folders as S3Folder[];
};

@ApiTags("Games")
@Controller("games/images")
export class ImageOrphansController {
  constructor(private readonly service: ImageOrphansService) {}

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/orphans")
  @ApiOperation({
    summary:
      "Start a background scan for objects in the game image folders that no game references any more",
  })
  @ApiResponse({ status: 201, description: "Scan started" })
  @ApiQuery({
    name: "apply",
    required: false,
    type: Boolean,
    description:
      "Delete the orphans from the Space; without it the scan only counts them. Irreversible",
  })
  @ApiQuery({
    name: "folders",
    required: false,
    description: `Comma separated folders to scan (default ${GAME_IMAGE_FOLDERS.join(", ")})`,
  })
  @ApiQuery({
    name: "prefix",
    required: false,
    description:
      "Only list keys under this prefix inside each folder; references are still read from the whole catalogue",
  })
  @ApiQuery({
    name: "minAgeDays",
    required: false,
    type: Number,
    description:
      "Never touch an object modified within this many days, so an upload racing the scan is safe (default 7)",
  })
  @ApiQuery({
    name: "maxDeleteRatio",
    required: false,
    type: Number,
    description:
      "Refuse to delete when orphans exceed this share of a folder (default 0.2)",
  })
  @ApiQuery({
    name: "sampleLimit",
    required: false,
    type: Number,
    description: "How many orphan keys to keep in the report (default 50)",
  })
  start(
    @Query("apply") apply?: string,
    @Query("folders") folders?: string,
    @Query("prefix") prefix?: string,
    @Query("minAgeDays") minAgeDays?: string,
    @Query("maxDeleteRatio") maxDeleteRatio?: string,
    @Query("sampleLimit") sampleLimit?: string
  ) {
    return this.service.start({
      apply: apply === "true",
      folders: parseFolders(folders),
      prefix,
      minAgeDays: parseNumber("minAgeDays", minAgeDays),
      maxDeleteRatio: parseNumber("maxDeleteRatio", maxDeleteRatio),
      sampleLimit: parseNumber("sampleLimit", sampleLimit),
    });
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("/orphans")
  @ApiOperation({ summary: "Read the state of the last orphan scan" })
  @ApiResponse({ status: 200, description: "Current scan state" })
  getState() {
    return this.service.getState();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Delete("/orphans")
  @ApiOperation({ summary: "Ask the running orphan scan to stop" })
  @ApiResponse({ status: 200, description: "Stop requested" })
  stop() {
    return this.service.stop();
  }
}
