import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import {
  Playthrough,
  type IPlaythroughDocument,
} from "../../games/schemas/playthroughs.schema";
import { User } from "../../user/schemas/user.schema";

const STEAM_PLATFORM_SLUG = "win";

@Injectable()
export class SteamPlaythroughsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Platform.name)
    private readonly platforms: Model<PlatformDocument>,
    @InjectModel(Playthrough.name)
    private readonly playthroughs: Model<IPlaythroughDocument>,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(SteamPlaythroughsService.name);
  }

  async sync(userId: mongoose.Types.ObjectId | string) {
    const user = await this.users
      .findById(userId)
      .select("steam steamIgnoredApps settings")
      .lean();

    if (!user?.steam?.steamId || !user.settings?.steamSyncPlaythroughs) {
      return { created: 0 };
    }

    const ignored = new Set(user.steamIgnoredApps ?? []);
    const mastered = (user.steam.achievements ?? []).filter(
      (entry) =>
        !!entry.gameId &&
        !!entry.total &&
        entry.unlocked >= entry.total &&
        !ignored.has(entry.appId)
    );

    if (!mastered.length) return { created: 0 };

    const gameIds = [...new Set(mastered.map(({ gameId }) => gameId!))];
    const gameObjectIds = gameIds.map((id) => new mongoose.Types.ObjectId(id));
    const playedIds = new Set(
      (
        await this.playthroughs
          .find({
            userId: { $in: [user._id, String(user._id)] },
            gameId: { $in: [...gameObjectIds, ...gameIds] },
          })
          .select("gameId")
          .lean()
      ).map(({ gameId }) => String(gameId))
    );
    const platform = await this.platforms
      .findOne({ slug: STEAM_PLATFORM_SLUG })
      .select("_id")
      .lean();
    const now = new Date().toISOString();
    const seen = new Set<string>();
    const toCreate: Partial<Playthrough>[] = [];

    for (const entry of mastered) {
      const gameId = entry.gameId!;

      if (playedIds.has(gameId) || seen.has(gameId)) continue;

      seen.add(gameId);
      toCreate.push({
        userId: user._id as unknown as mongoose.Schema.Types.ObjectId,
        gameId: new mongoose.Types.ObjectId(
          gameId
        ) as unknown as mongoose.Schema.Types.ObjectId,
        category: "completed",
        isMastered: true,
        date: entry.masteredAt ? entry.masteredAt.slice(0, 10) : "",
        ...(platform && {
          platformId: platform._id as unknown as mongoose.Schema.Types.ObjectId,
        }),
        isPublic: false,
        steamAppId: entry.appId,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (toCreate.length) {
      await this.playthroughs.insertMany(toCreate);
      this.logger.info(
        `Steam playthroughs for user ${String(user._id)}: created ${toCreate.length}`
      );
    }

    return { created: toCreate.length };
  }
}
