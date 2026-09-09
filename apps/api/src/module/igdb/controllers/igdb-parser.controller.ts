import {
  BadRequestException,
  Controller,
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
import { IGDBService } from "../igdb.service";
import { AuthGuard } from "@nestjs/passport";
import { RolesEnum } from "src/shared/zod/schemas/role.schema";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";

@ApiTags("IGDB")
@Controller("igdb")
export class IgdbParserController {
  constructor(private readonly service: IGDBService) {}

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/platforms/parse")
  @ApiOperation({ summary: "Parse platforms directly from IGDB" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on existing platforms instead of a full upsert",
  })
  async parsePlatforms(@Query("field") field?: string) {
    return this.service.parsePlatformsFromIgdb({ field });
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/parse")
  @ApiOperation({
    summary:
      "Parse a game directly from IGDB by IGDB id or slug (creates it if not present yet)",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({
    name: "igdbId",
    required: false,
    description: "IGDB id of the game to parse",
  })
  @ApiQuery({
    name: "slug",
    required: false,
    description: "IGDB slug of the game to parse",
  })
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
    description:
      "Download cover/screenshots/artworks and upload them to S3 while parsing",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on the game instead of a full upsert (e.g. franchises, videos, hypes, cover). The game must already exist; unknown fields are rejected",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite the field if it is already filled. For image fields, also re-download images that are already present",
  })
  async parseGame(
    @Query("igdbId") igdbIdQuery?: string,
    @Query("slug") slug?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    if (!igdbIdQuery && !slug) {
      throw new BadRequestException("Either igdbId or slug must be provided");
    }

    return this.service.parseGameFromIgdb(
      {
        igdbId: igdbIdQuery ? Number(igdbIdQuery) : undefined,
        slug,
      },
      {
        parseImages:
          parseImagesQuery === undefined ? true : parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
      }
    );
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/backfill")
  @ApiOperation({
    summary: "Backfill the full IGDB games catalog directly into games",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "limit",
    default: 100,
    required: false,
    type: Number,
    description: "Page size for each IGDB request batch",
  })
  @ApiQuery({
    name: "delayMs",
    default: 1000,
    required: false,
    type: Number,
    description: "Delay in milliseconds between IGDB request batches",
  })
  @ApiQuery({
    name: "concurrency",
    default: 5,
    required: false,
    type: Number,
    description: "Number of games upserted concurrently per batch",
  })
  @ApiQuery({
    name: "parseImages",
    default: false,
    required: false,
    type: Boolean,
    description:
      "Download cover/screenshots/artworks and upload them to S3 while backfilling",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on existing games instead of a full upsert (e.g. franchises, videos, hypes, cover). The game must already exist; unknown fields are rejected",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite games where the field is already filled (by default only empty/missing values are backfilled). For image fields, also re-download images that are already present",
  })
  @ApiQuery({
    name: "releaseAfter",
    required: false,
    type: Number,
    description:
      "Unix timestamp (seconds); only games with first_release_date after this are backfilled",
  })
  @ApiQuery({
    name: "skipCheckpoint",
    default: false,
    required: false,
    type: Boolean,
    description:
      "Skip full-catalog checkpoint bookkeeping; use for partial/filtered runs (e.g. field=hypes with releaseAfter)",
  })
  backfillGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string,
    @Query("releaseAfter") releaseAfterQuery?: string,
    @Query("skipCheckpoint") skipCheckpointQuery?: string
  ) {
    void this.service
      .backfillGamesFromIgdb({
        limit: Number(limitQuery) || undefined,
        delayMs: Number(delayMsQuery) || undefined,
        concurrency: Number(concurrencyQuery) || undefined,
        parseImages: parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
        releaseAfter: Number(releaseAfterQuery) || undefined,
        skipCheckpoint: skipCheckpointQuery === "true",
      })
      .catch(() => undefined);

    return { message: "Backfill started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/sync")
  @ApiOperation({
    summary:
      "Sync changed IGDB games directly into games, bypassing the local IGDB mirror",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "limit",
    default: 100,
    required: false,
    type: Number,
    description: "Page size for each IGDB request batch",
  })
  @ApiQuery({
    name: "delayMs",
    default: 1000,
    required: false,
    type: Number,
    description: "Delay in milliseconds between IGDB request batches",
  })
  @ApiQuery({
    name: "concurrency",
    default: 5,
    required: false,
    type: Number,
    description: "Number of games upserted concurrently per batch",
  })
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
    description:
      "Download cover/screenshots/artworks and upload them to S3 while syncing",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on existing games instead of a full upsert (e.g. franchises, videos, hypes, cover). The game must already exist; unknown fields are rejected",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite games where the field is already filled (by default only empty/missing values are synced). For image fields, also re-download images that are already present",
  })
  syncGames(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    void this.service
      .syncGamesFromIgdb({
        limit: Number(limitQuery) || undefined,
        delayMs: Number(delayMsQuery) || undefined,
        concurrency: Number(concurrencyQuery) || undefined,
        parseImages:
          parseImagesQuery === undefined ? true : parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
      })
      .catch(() => undefined);

    return { message: "Sync started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/link-related")
  @ApiOperation({
    summary:
      "Resolve IGDB related-game ids (dlcs, expansions, remakes, similar_games, etc.) into internal game references on every game. Runs daily at 04:30 (Europe/Moscow), after the IGDB/RA sync crons; use this to re-run it manually",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  linkRelatedGames() {
    void this.service.linkRelatedGames().catch(() => undefined);

    return { message: "Linking started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/games/dedupe-slugs")
  @ApiOperation({
    summary:
      "Resolve duplicate game slugs by keeping the oldest game's slug and appending its IGDB id (or _id) to every other game sharing it. Run once before the unique slug index can build; safe to re-run any time",
  })
  @ApiResponse({ status: 200, description: "Successfully deduplicated" })
  async dedupeSlugs() {
    return this.service.deduplicateGameSlugs();
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/characters/parse")
  @ApiOperation({
    summary:
      "Parse a character directly from IGDB by IGDB id or slug (creates it if not present yet)",
  })
  @ApiResponse({ status: 200, description: "Successfully parsed" })
  @ApiQuery({
    name: "igdbId",
    required: false,
    description: "IGDB id of the character to parse",
  })
  @ApiQuery({
    name: "slug",
    required: false,
    description: "IGDB slug of the character to parse",
  })
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
    description: "Download the mug shot and upload it to S3 while parsing",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on the character instead of a full upsert (e.g. akas, description, mugShot). The character must already exist; unknown fields are rejected",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite the field if it is already filled. For mugShot, also re-download a mug shot that is already present",
  })
  async parseCharacter(
    @Query("igdbId") igdbIdQuery?: string,
    @Query("slug") slug?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    if (!igdbIdQuery && !slug) {
      throw new BadRequestException("Either igdbId or slug must be provided");
    }

    return this.service.parseCharacterFromIgdb(
      {
        igdbId: igdbIdQuery ? Number(igdbIdQuery) : undefined,
        slug,
      },
      {
        parseImages:
          parseImagesQuery === undefined ? true : parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
      }
    );
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/characters/backfill")
  @ApiOperation({
    summary: "Backfill the full IGDB characters catalog into characters",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "limit",
    default: 100,
    required: false,
    type: Number,
    description: "Page size for each IGDB request batch",
  })
  @ApiQuery({
    name: "delayMs",
    default: 1000,
    required: false,
    type: Number,
    description: "Delay in milliseconds between IGDB request batches",
  })
  @ApiQuery({
    name: "concurrency",
    default: 5,
    required: false,
    type: Number,
    description: "Number of characters upserted concurrently per batch",
  })
  @ApiQuery({
    name: "parseImages",
    default: false,
    required: false,
    type: Boolean,
    description: "Download mug shots and upload them to S3 while backfilling",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on existing characters instead of a full upsert (e.g. akas, description, mugShot). The character must already exist; unknown fields are rejected",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite characters where the field is already filled. For mugShot, also re-download mug shots that are already present",
  })
  @ApiQuery({
    name: "skipCheckpoint",
    default: false,
    required: false,
    type: Boolean,
    description:
      "Skip full-catalog checkpoint bookkeeping; use for partial/filtered runs",
  })
  @ApiQuery({
    name: "maxItems",
    required: false,
    type: Number,
    description:
      "Stop after this many characters instead of walking the whole catalog; use it for a bounded trial run. Implies skipCheckpoint, so a partial run never marks the backfill complete",
  })
  backfillCharacters(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string,
    @Query("skipCheckpoint") skipCheckpointQuery?: string,
    @Query("maxItems") maxItemsQuery?: string
  ) {
    void this.service
      .backfillCharactersFromIgdb({
        limit: Number(limitQuery) || undefined,
        delayMs: Number(delayMsQuery) || undefined,
        concurrency: Number(concurrencyQuery) || undefined,
        parseImages: parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
        skipCheckpoint: skipCheckpointQuery === "true",
        maxItems: Number(maxItemsQuery) || undefined,
      })
      .catch(() => undefined);

    return { message: "Backfill started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/characters/sync")
  @ApiOperation({
    summary:
      "Sync changed IGDB characters into characters. Runs daily at 06:00 (Europe/Moscow); use this to re-run it manually",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  @ApiQuery({
    name: "limit",
    default: 100,
    required: false,
    type: Number,
    description: "Page size for each IGDB request batch",
  })
  @ApiQuery({
    name: "delayMs",
    default: 1000,
    required: false,
    type: Number,
    description: "Delay in milliseconds between IGDB request batches",
  })
  @ApiQuery({
    name: "concurrency",
    default: 5,
    required: false,
    type: Number,
    description: "Number of characters upserted concurrently per batch",
  })
  @ApiQuery({
    name: "parseImages",
    default: true,
    required: false,
    type: Boolean,
    description: "Download mug shots and upload them to S3 while syncing",
  })
  @ApiQuery({
    name: "field",
    required: false,
    description:
      "Update only this single field on existing characters instead of a full upsert",
  })
  @ApiQuery({
    name: "forceParse",
    default: false,
    required: false,
    type: Boolean,
    description:
      "When field is set, also overwrite characters where the field is already filled",
  })
  syncCharacters(
    @Query("limit") limitQuery?: string,
    @Query("delayMs") delayMsQuery?: string,
    @Query("concurrency") concurrencyQuery?: string,
    @Query("parseImages") parseImagesQuery?: string,
    @Query("field") field?: string,
    @Query("forceParse") forceParseQuery?: string
  ) {
    void this.service
      .syncCharactersFromIgdb({
        limit: Number(limitQuery) || undefined,
        delayMs: Number(delayMsQuery) || undefined,
        concurrency: Number(concurrencyQuery) || undefined,
        parseImages:
          parseImagesQuery === undefined ? true : parseImagesQuery === "true",
        field,
        forceParse: forceParseQuery === "true",
      })
      .catch(() => undefined);

    return { message: "Sync started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Post("/characters/link-games")
  @ApiOperation({
    summary:
      "Resolve IGDB character game ids into internal references on both sides (character.gameIds and game.characters). Runs daily at 06:30 (Europe/Moscow), after the characters sync cron; use this to re-run it manually",
  })
  @ApiResponse({ status: 200, description: "Successfully started" })
  linkGameCharacters() {
    void this.service.linkGameCharacters().catch(() => undefined);

    return { message: "Linking started" };
  }

  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @UseGuards(AuthGuard("jwt"))
  @Get("/token")
  @ApiOperation({ summary: "Get IGDB token" })
  @ApiResponse({ status: 200, description: "Successfully started" })
  getToken() {
    return this.service.getToken();
  }
}
