import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "@mooncellar/schemas";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { ImageDedupeService } from "../services/image-dedupe.service";
import {
  type IGameImageDedupeOptions,
  type TGameImageField,
} from "../interface/image-dedupe.interface";

const IMAGE_FIELDS: TGameImageField[] = ["screenshots", "artworks"];

const parseBoolean = (value?: string) => value === "true";

const parseFields = (value?: string): TGameImageField[] | undefined => {
  if (!value) return undefined;

  const fields = value
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  const unknown = fields.filter(
    (field) => !IMAGE_FIELDS.includes(field as TGameImageField)
  );

  if (unknown.length) {
    throw new BadRequestException(
      `Unknown image fields: ${unknown.join(", ")}. Allowed: ${IMAGE_FIELDS.join(", ")}`
    );
  }

  return fields as TGameImageField[];
};

const parseThreshold = (value?: string) => {
  if (value === undefined) return undefined;

  const threshold = Number(value);

  if (!Number.isFinite(threshold)) {
    throw new BadRequestException("threshold must be a number");
  }

  return threshold;
};

@ApiTags("Games")
@Controller("games/images")
export class ImageDedupeController {
  constructor(private readonly service: ImageDedupeService) {}

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/dedupe")
  @ApiOperation({
    summary:
      "Start a background run that deduplicates game images across the catalogue",
  })
  @ApiResponse({ status: 201, description: "Run started" })
  @ApiQuery({
    name: "apply",
    required: false,
    type: Boolean,
    description:
      "Write the deduplicated arrays back to games; without it the run only reports",
  })
  @ApiQuery({
    name: "deleteObjects",
    required: false,
    type: Boolean,
    description:
      "With apply, also delete the dropped objects from the Space. Irreversible",
  })
  @ApiQuery({
    name: "threshold",
    required: false,
    type: Number,
    description:
      "Maximum Hamming distance between perceptual hashes that still counts as the same image (default 10 of 256 bits)",
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description: "Comma separated image fields to check (default both)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Stop after this many games",
  })
  @ApiQuery({
    name: "fromId",
    required: false,
    description: "Resume after this game id instead of starting from the first",
  })
  @ApiQuery({
    name: "onlyMixedSources",
    required: false,
    type: Boolean,
    description:
      "Only visit games whose screenshots hold both a legacy regru URL and a current CDN URL",
  })
  startBatch(
    @Query("apply") apply?: string,
    @Query("deleteObjects") deleteObjects?: string,
    @Query("threshold") threshold?: string,
    @Query("fields") fields?: string,
    @Query("limit") limit?: string,
    @Query("fromId") fromId?: string,
    @Query("onlyMixedSources") onlyMixedSources?: string
  ) {
    return this.service.startBatch({
      ...this.parseOptions(apply, deleteObjects, threshold, fields),
      limit: limit ? Number(limit) : undefined,
      fromId,
      onlyMixedSources: parseBoolean(onlyMixedSources),
    });
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("/dedupe")
  @ApiOperation({ summary: "Read the state of the last image dedupe run" })
  @ApiResponse({ status: 200, description: "Current run state" })
  getBatchState() {
    return this.service.getBatchState();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Delete("/dedupe")
  @ApiOperation({ summary: "Ask the running image dedupe run to stop" })
  @ApiResponse({ status: 200, description: "Stop requested" })
  stopBatch() {
    return this.service.stopBatch();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/dedupe/:slug")
  @ApiOperation({
    summary:
      "Find images of one game that repeat by md5 or by perceptual hash, and optionally drop them",
  })
  @ApiResponse({ status: 201, description: "Report for the game" })
  @ApiParam({ name: "slug", description: "Game slug" })
  @ApiQuery({
    name: "apply",
    required: false,
    type: Boolean,
    description:
      "Write the deduplicated arrays back to the game; without it the call only reports",
  })
  @ApiQuery({
    name: "deleteObjects",
    required: false,
    type: Boolean,
    description:
      "With apply, also delete the dropped objects from the Space. Irreversible",
  })
  @ApiQuery({
    name: "threshold",
    required: false,
    type: Number,
    description:
      "Maximum Hamming distance between perceptual hashes that still counts as the same image (default 10 of 256 bits)",
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description: "Comma separated image fields to check (default both)",
  })
  dedupeGame(
    @Param("slug") slug: string,
    @Query("apply") apply?: string,
    @Query("deleteObjects") deleteObjects?: string,
    @Query("threshold") threshold?: string,
    @Query("fields") fields?: string
  ) {
    return this.service.dedupeGame(
      slug,
      this.parseOptions(apply, deleteObjects, threshold, fields)
    );
  }

  private parseOptions(
    apply?: string,
    deleteObjects?: string,
    threshold?: string,
    fields?: string
  ): IGameImageDedupeOptions {
    return {
      apply: parseBoolean(apply),
      deleteObjects: parseBoolean(deleteObjects),
      threshold: parseThreshold(threshold),
      fields: parseFields(fields),
    };
  }
}
