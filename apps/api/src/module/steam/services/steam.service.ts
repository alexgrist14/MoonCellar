import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Game, GameDocument } from "../../games/schemas/game.schema";
import { BusinessMetricsService } from "src/module/metrics/business-metrics.service";
import { findSteamAppInfo, mergeSteamStore } from "../utils/steam.utils";

@Injectable()
export class SteamService {
  private readonly logger = new Logger(SteamService.name);

  constructor(
    @InjectModel(Game.name)
    private readonly games: Model<GameDocument>,
    private readonly metrics: BusinessMetricsService
  ) {}

  async parseSteamLinksForGames(options?: { forceParse?: boolean }) {
    try {
      this.logger.log(
        `Started parsing Steam links for games (forceParse=${!!options?.forceParse})`
      );

      const filter = options?.forceParse
        ? { websites: { $exists: true, $ne: [] } }
        : {
            websites: { $exists: true, $ne: [] },
            externalPages: { $not: { $elemMatch: { name: "Steam" } } },
          };

      const games = await this.games
        .find(filter)
        .select("_id websites externalPages");

      const now = new Date().toISOString();
      const bulkOps = [];

      for (const game of games) {
        const steamInfo = findSteamAppInfo(game.websites);
        if (!steamInfo) continue;

        bulkOps.push({
          updateOne: {
            filter: { _id: game._id },
            update: {
              $set: {
                externalPages: mergeSteamStore(
                  game.externalPages,
                  steamInfo
                ),
                updatedAt: now,
              },
            },
          },
        });
      }

      if (bulkOps.length) {
        await this.games.bulkWrite(bulkOps);
      }

      this.metrics.recordGames("steam", "updated", bulkOps.length);

      this.logger.log(
        `Finished parsing Steam links, updated ${bulkOps.length}/${games.length} games`
      );

      return { matched: games.length, updated: bulkOps.length };
    } catch (err) {
      this.logger.error(err, "Failed to parse Steam links for games");
      throw err;
    }
  }

  async parseSteamLinkForGame(identifier: { id?: string; slug?: string }) {
    try {
      if (!identifier.id && !identifier.slug) {
        throw new BadRequestException("Either id or slug must be provided");
      }

      const game = await this.games
        .findOne(
          identifier.id ? { _id: identifier.id } : { slug: identifier.slug }
        )
        .select("_id slug websites externalPages");

      if (!game) {
        throw new NotFoundException(
          `Game not found: ${identifier.id ?? identifier.slug}`
        );
      }

      const steamInfo = findSteamAppInfo(game.websites);

      if (!steamInfo) {
        throw new NotFoundException(
          `No Steam link found for game: ${game.slug}`
        );
      }

      const externalPages = mergeSteamStore(game.externalPages, steamInfo);

      await this.games.updateOne(
        { _id: game._id },
        {
          $set: {
            externalPages,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      this.metrics.recordGames("steam", "updated", 1);

      this.logger.log(
        `Parsed Steam link for game: ${game.slug} (gameId=${steamInfo.gameId})`
      );

      return {
        slug: game.slug,
        steam: externalPages.find((store) => store.name === "Steam"),
      };
    } catch (err) {
      this.logger.error(
        err,
        `Failed to parse Steam link for game: ${identifier.id ?? identifier.slug}`
      );
      throw err;
    }
  }
}
